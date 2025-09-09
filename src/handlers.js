// 微信自动回复系统 - 消息处理器模块

const config = require('../config');
const { extractPoiid, renderTemplate } = require('./utils');

/**
 * 处理文本消息
 * @param {Object} message - 消息对象
 * @returns {string} 回复内容
 */
function handleTextMessage(message) {
  try {
    if (!message || !message.Content) {
      console.warn('[文本消息处理] 消息对象为空或缺少Content字段');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    const content = message.Content.trim();
    console.log(`[文本消息处理] 收到文本消息: ${content}`);
    
    // 检查是否包含关键词
    if (config.keywords) {
      // 遍历关键词配置
      for (const [key, reply] of Object.entries(config.keywords)) {
        // 检查关键词是否在消息中出现
        if (content.includes(key)) {
          console.log(`[文本消息处理] 匹配关键词: ${key}`);
          
          // 如果是模板回复，进行模板渲染
          if (typeof reply === 'string' && reply.includes('{{')) {
            return renderTemplate(reply, {
              content: content,
              keyword: key
            });
          }
          
          return reply;
        }
      }
    }
    
    // 未匹配到关键词，返回默认回复
    console.log('[文本消息处理] 未匹配到关键词，返回默认回复');
    return config.defaultReply || '抱歉，我还不明白您的意思，请尝试输入其他关键词。';
  } catch (error) {
    console.error('[文本消息处理错误]', error);
    console.error('[文本消息处理] 错误堆栈:', error.stack);
    return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
  }
}

/**
 * 处理小程序页面消息
 * @param {Object} message - 消息对象
 * @returns {string} 回复内容
 */
function handleMiniprogramMessage(message) {
  try {
    if (!message || !message.PagePath) {
      console.warn('[小程序消息处理] 消息对象为空或缺少PagePath字段');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    console.log(`[小程序消息处理] 收到小程序页面消息: ${message.Title || ''}`);
    console.log(`[小程序消息处理] 页面路径: ${message.PagePath}`);
    
    // 提取poiid
    const poiid = extractPoiid(message.PagePath);
    console.log(`[小程序消息处理] 提取到poiid: ${poiid || '未找到'}`);
    
    // 构建美团优惠券链接
    let couponLink = null;
    if (poiid && config.meituanLinks && config.meituanLinks.baseShopCouponLink) {
      couponLink = `${config.meituanLinks.baseShopCouponLink}${poiid}`;
      console.log(`[小程序消息处理] 构建优惠券链接: ${couponLink}`);
    }
    
    // 准备模板数据
    const templateData = {
      pageTitle: message.Title || '商品页面',
      poiid: poiid || '未知',
      couponLink: couponLink,
      meituanLinkA: config.meituanLinks?.linkA,
      meituanLinkB: config.meituanLinks?.linkB,
      meituanLinkC: config.meituanLinks?.linkC,
      meituanLinkD: config.meituanLinks?.linkD,
      meituanLinkE: config.meituanLinks?.linkE,
      meituanLinkF: config.meituanLinks?.linkF
    };
    
    // 使用配置中的小程序消息回复模板或默认模板
    const template = config.miniprogramReplyTemplate || `
【${config.businessName || '商家名称'}】
您查看的商品：{{pageTitle}}

为您准备了专属优惠，点击下方链接领取：
{{couponLink}}

更多优惠活动：
{{meituanLinkA}}
{{meituanLinkB}}
{{meituanLinkC}}
    `;
    
    // 渲染回复模板
    const reply = renderTemplate(template, templateData);
    console.log(`[小程序消息处理] 生成回复内容，长度: ${reply.length}`);
    
    return reply;
  } catch (error) {
    console.error('[小程序消息处理错误]', error);
    console.error('[小程序消息处理] 错误堆栈:', error.stack);
    return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
  }
}

/**
 * 处理未知类型的消息
 * @param {Object} message - 消息对象
 * @returns {string} 回复内容
 */
function handleUnknownMessage(message) {
  try {
    if (!message) {
      console.warn('[未知消息处理] 消息对象为空');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    const msgType = message.MsgType || 'unknown';
    console.log(`[未知消息处理] 收到未知类型消息: ${msgType}`);
    
    // 记录消息内容以便调试
    const safeMessageForLog = {
      MsgType: msgType,
      CreateTime: message.CreateTime,
      MsgId: message.MsgId
    };
    console.log(`[未知消息处理] 消息详情:`, safeMessageForLog);
    
    // 返回未知消息的默认回复
    return config.unknownMessageReply || config.defaultReply || '感谢您的消息，我们会尽快回复您。';
  } catch (error) {
    console.error('[未知消息处理错误]', error);
    console.error('[未知消息处理] 错误堆栈:', error.stack);
    return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
  }
}

/**
 * 消息处理主函数
 * @param {Object} message - 解析后的消息对象
 * @returns {string} 回复内容
 */
function processMessage(message) {
  try {
    if (!message || typeof message !== 'object') {
      console.warn('[消息处理] 输入不是有效的消息对象');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    console.log(`[消息处理] 开始处理消息类型: ${message.MsgType}`);
    
    // 根据消息类型分发到不同的处理函数
    switch (message.MsgType) {
      case 'text':
        return handleTextMessage(message);
      case 'miniprogrampage':
        return handleMiniprogramMessage(message);
      default:
        return handleUnknownMessage(message);
    }
  } catch (error) {
    console.error('[消息处理主函数错误]', error);
    console.error('[消息处理] 错误堆栈:', error.stack);
    return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
  }
}

// 导出所有消息处理函数
module.exports = {
  handleTextMessage,
  handleMiniprogramMessage,
  handleUnknownMessage,
  processMessage
};