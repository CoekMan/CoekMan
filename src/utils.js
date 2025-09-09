// 微信自动回复系统 - 工具函数模块

const config = require('../config');

/**
 * 解析微信消息XML格式 - 增强版
 * @param {string} xmlString - XML字符串
 * @returns {Object|null} 解析后的消息对象
 */
function parseXml(xmlString) {
  try {
    if (!xmlString) {
      console.warn('[XML解析] 输入为空');
      return null;
    }
    
    if (typeof xmlString !== 'string') {
      console.warn('[XML解析] 输入不是字符串类型，而是:', typeof xmlString);
      // 尝试转换为字符串
      try {
        xmlString = String(xmlString);
        console.log('[XML解析] 已尝试将输入转换为字符串');
      } catch (err) {
        console.error('[XML解析] 转换输入为字符串失败:', err);
        return null;
      }
    }
    
    // 记录XML字符串的前100个字符用于调试
    console.log(`[XML解析] 输入字符串预览: ${xmlString.substring(0, 100)}...`);
    
    const result = {};
    
    // 增强版提取字段的辅助函数 - 支持带CDATA和不带CDATA的XML格式
    const extractField = (fieldName) => {
      // 尝试匹配带CDATA的格式
      const cdataRegex = new RegExp(`<${fieldName}><!\[CDATA\[(.*?)\]\]><\/${fieldName}>`, 's');
      let match = xmlString.match(cdataRegex);
      if (match) return match[1];
      
      // 尝试匹配不带CDATA的格式
      const simpleRegex = new RegExp(`<${fieldName}>(.*?)<\/${fieldName}>`, 's');
      match = xmlString.match(simpleRegex);
      if (match) return match[1];
      
      // 尝试匹配可能的转义字符格式
      const escapedRegex = new RegExp(`&lt;${fieldName}&gt;(.*?)&lt;\/${fieldName}&gt;`, 's');
      match = xmlString.match(escapedRegex);
      if (match) return match[1];
      
      return null;
    };
    
    // 提取基本消息字段 - 同时尝试标准和小写版本的标签名
    result.ToUserName = extractField('ToUserName') || extractField('tousername');
    result.FromUserName = extractField('FromUserName') || extractField('fromusername');
    result.CreateTime = extractField('CreateTime') || extractField('createtime');
    result.MsgType = extractField('MsgType') || extractField('msgtype');
    
    // 记录提取到的基本字段
    console.log(`[XML解析] 提取到消息类型: ${result.MsgType}`);
    
    // 根据消息类型提取特定字段
    if (result.MsgType === 'text') {
      result.Content = extractField('Content') || extractField('content');
      result.MsgId = extractField('MsgId') || extractField('msgid');
    } else if (result.MsgType === 'miniprogrampage') {
      result.Title = extractField('Title') || extractField('title');
      result.AppId = extractField('AppId') || extractField('appid');
      result.PagePath = extractField('PagePath') || extractField('pagepath');
      result.ThumbUrl = extractField('ThumbUrl') || extractField('thumburl');
      result.ThumbMediaId = extractField('ThumbMediaId') || extractField('thumbmediaid');
      result.MsgId = extractField('MsgId') || extractField('msgid');
    }
    
    // 验证必要字段
    if (!result.ToUserName || !result.FromUserName || !result.MsgType) {
      console.warn('[XML解析] 缺少必要的消息字段');
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('[XML解析错误]', error);
    console.error('[XML解析] 错误堆栈:', error.stack);
    return null;
  }
}

/**
 * 从页面路径中提取poiid
 * @param {string} pagepath - 页面路径
 * @returns {string|null} poiid或null
 */
function extractPoiid(pagepath) {
  try {
    if (!pagepath || typeof pagepath !== 'string') {
      return null;
    }
    
    // 匹配poiid参数
    const regex = /poiid=(\d+)/;
    const match = pagepath.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('[提取poiid错误]', error);
    console.error('[提取poiid] 错误堆栈:', error.stack);
    return null;
  }
}

/**
 * 渲染回复模板
 * @param {string} template - 模板字符串
 * @param {Object} data - 模板数据
 * @returns {string} 渲染后的字符串
 */
function renderTemplate(template, data) {
  try {
    if (!template || typeof template !== 'string') {
      console.warn('[模板渲染] 模板为空或不是字符串');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    if (!data || typeof data !== 'object') {
      console.warn('[模板渲染] 数据为空或不是对象');
      return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
    }
    
    let result = template;
    
    // 替换模板中的变量
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      
      // 获取链接值并去除可能的反引号和前后空格
      let linkValue = data[key];
      if (typeof linkValue === 'string') {
        // 去除前后的反引号和空格
        linkValue = linkValue.replace(/^`|`$/g, '').trim();
      }
      
      // 检查是否是链接变量，如果是，则根据链接类型决定是否使用微信官方"网页"小程序中转
      if (key.includes('link') || key.includes('url') || key.includes('Link')) {
        // 对于小程序链接(以#小程序://开头)，保持原样
        if (typeof linkValue === 'string' && linkValue.startsWith('#小程序://')) {
          result = result.replace(regex, linkValue);
        } else if (typeof linkValue === 'string' && linkValue) {
          // 对于其他链接，使用微信官方"网页"小程序中转格式
          try {
            const redirectUrl = config.wechatWebAppConfig?.baseUrl + encodeURIComponent(linkValue);
            result = result.replace(regex, redirectUrl);
          } catch (encodeError) {
            console.error('[模板渲染] URL编码错误:', encodeError);
            result = result.replace(regex, linkValue);
          }
        } else {
          // 空链接或非字符串链接，替换为空
          result = result.replace(regex, '');
        }
      } else {
        // 普通变量直接替换
        result = result.replace(regex, data[key] || '');
      }
    });
    
    return result;
  } catch (error) {
    console.error('[模板渲染错误]', error);
    console.error('[模板渲染] 错误堆栈:', error.stack);
    return config.defaultReply || '抱歉，消息处理出错，请稍后再试。';
  }
}

/**
 * 构建回复XML - 增强版
 * @param {Object} originalMessage - 原始消息对象
 * @param {string} replyContent - 回复内容
 * @returns {string} XML格式的回复
 */
function buildReplyXml(originalMessage, replyContent) {
  try {
    // 参数验证
    if (!originalMessage || typeof originalMessage !== 'object') {
      console.warn('[XML构建] 原始消息对象为空或不是对象');
      return '';
    }
    
    if (!replyContent || typeof replyContent !== 'string') {
      console.warn('[XML构建] 回复内容为空或不是字符串');
      replyContent = '';
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // 安全获取FromUserName和ToUserName，支持标准格式和云托管平台格式
    const toUserName = originalMessage.FromUserName || originalMessage.fromUserName || '';
    const fromUserName = originalMessage.ToUserName || originalMessage.toUserName || '';
    
    // 转义CDATA中的特殊字符 - 优化版，仅处理必要的字符
    const escapeCdata = (text) => {
      if (!text || typeof text !== 'string') {
        return '';
      }
      // 处理CDATA结束标记 ']]>'
      return text.replace(/]]>/g, ']]]]><![CDATA[>');
    };
    
    console.log(`[XML构建] 准备发送回复给: ${toUserName}`);
    
    return `<xml>
  <ToUserName><![CDATA[${escapeCdata(toUserName)}]]></ToUserName>
  <FromUserName><![CDATA[${escapeCdata(fromUserName)}]]></FromUserName>
  <CreateTime>${now}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${escapeCdata(replyContent)}]]></Content>
</xml>`;
  } catch (error) {
    console.error('[XML构建错误]', error);
    console.error('[XML构建] 错误堆栈:', error.stack);
    return '';
  }
}

/**
 * 设置嵌套对象的属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {*} value - 要设置的值
 */
function setNestedProperty(obj, path, value) {
  try {
    if (!obj || typeof obj !== 'object') {
      console.error('[配置错误] 目标对象无效');
      return;
    }
    
    if (!path || typeof path !== 'string') {
      console.error('[配置错误] 属性路径无效');
      return;
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    const parent = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, obj);
    
    parent[lastKey] = value;
  } catch (error) {
    console.error(`[配置错误] 设置属性 ${path} 失败:`, error);
    console.error(`[配置错误] 设置属性 ${path} 堆栈:`, error.stack);
  }
}

/**
 * 从环境变量覆盖配置
 */
function overrideConfigWithEnvVars() {
  // 支持从环境变量中覆盖的配置项
  const configKeys = [
    'keywords',
    'defaultReply',
    'meituanLinks.linkA',
    'meituanLinks.linkB',
    'meituanLinks.linkC',
    'meituanLinks.linkD',
    'meituanLinks.linkE',
    'meituanLinks.linkF',
    'meituanLinks.baseShopCouponLink',
    'wechatWebAppConfig.baseUrl'
  ];

  configKeys.forEach(key => {
    // 转换为环境变量名格式 (如：meituanLinks.linkA -> MEITUAN_LINKS_LINKA)
    const envVarName = key.toUpperCase().replace(/\./g, '_');
    const envVarValue = process.env[envVarName];
    
    if (envVarValue) {
      try {
        // 尝试解析JSON格式的环境变量
        const parsedValue = JSON.parse(envVarValue);
        setNestedProperty(config, key, parsedValue);
        console.log(`[配置更新] ${key} 已从环境变量 ${envVarName} 覆盖`);
      } catch (e) {
        // 如果不是JSON格式，就作为普通字符串处理
        setNestedProperty(config, key, envVarValue);
        console.log(`[配置更新] ${key} 已从环境变量 ${envVarName} 覆盖 (字符串值)`);
      }
    }
  });
}

// 导出所有工具函数
module.exports = {
  parseXml,
  extractPoiid,
  renderTemplate,
  buildReplyXml,
  setNestedProperty,
  overrideConfigWithEnvVars
};