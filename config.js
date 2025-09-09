// 配置文件 - 可直接修改无需重新部署

// 微信公众号自动回复系统配置文件
// 支持从环境变量加载配置，环境变量优先级高于默认配置

// 默认配置
const defaultConfig = {
  // 关键词-回复文本映射表
  keywords: [
    { keyword: '测试', reply: '测试完成。' }
  ],
  
  // 默认回复文本
  defaultReply: '感谢您的消息！请发送美团外卖小程序卡片获取专属福利，其他功能请等待上线。',

  // 微信官方"网页"小程序中转配置
  wechatWebAppConfig: {
    // 微信网页小程序中转URL模板
    // 格式: weixin://dl/business/?t=URL_ENCODED
    baseUrl: 'weixin://dl/business/?t='
  },

  // 美团相关链接配置
  meituanLinks: {
    // 固定链接A/B/C/D/E
    linkA: ' `https://kurl01.cn/75Mx7a` ', // 美团外卖红包1
    linkB: ' `https://kurl01.cn/75Mx7f` ', // 美团外卖红包2
    linkC: '#小程序://美团外卖丨外卖美食奶茶咖啡水果/kPOfmjsimwLLIxC', // 免配入口
    linkD: '#小程序://美团外卖丨外卖美食奶茶咖啡水果/AM0JMCilcHUdQMp', // 美团外卖小程序
    linkE: ' `https://offsiteact.meituan.com/web/hoae/collection_waimai_v8/index.html?recallBizId=cpsH5Coupon&bizId=224ac1afd8674632ae7b85226f192d82&mediumSrc1=224ac1afd8674632ae7b85226f192d82&scene=CPS_SELF_SRC&pageSrc1=CPS_SELF_OUT_SRC_H5_LINK&pageSrc2=224ac1afd8674632ae7b85226f192d82&pageSrc3=f9f5776e716941fdaba720b243525425&activityId=6&mediaPvId=dafkdsajffjafdfs&mediaUserId=10086&outActivityId=6&hoaePageV=8&p=1006228694084128768` ', // 商家券领取固定链接
    linkF: ' `https://kurl02.cn/75Mx80` ', // 淘宝闪购红包
    
    // 商家券基础链接
    baseShopCouponLink: ' `https://offsiteact.meituan.com/web/hoae/collection_waimai_v8/index.html?recallBizId=cpsH5Coupon&bizId=224ac1afd8674632ae7b85226f192d82&mediumSrc1=224ac1afd8674632ae7b85226f192d82&scene=CPS_SELF_SRC&pageSrc1=CPS_SELF_OUT_SRC_H5_LINK&pageSrc2=224ac1afd8674632ae7b85226f192d82&pageSrc3=f9f5776e716941fdaba720b243525425&activityId=6&mediaPvId=dafkdsajffjafdfs&mediaUserId=10086&outActivityId=6&hoaePageV=8&p=1006228694084128768` '
  },
  
  // 排版模板配置
  templates: {
    // 场景2：小程序卡片含poiid的回复模板
    withPoiid: `【美团外卖专属福利】
 - 
 1. 点我领取美团红包1 → {{linkA}}
 - 
 2. 点我领取美团红包2 → {{linkB}}
 - 
 3. 点我领取商家券 → {{shopCouponLink}}
 - 
 4. 免配入口 → {{linkC}}
 - 
 5. 点我领取淘宝闪购红包 → {{linkF}}
 `,
    // 场景3：小程序卡片不含poiid的回复模板
    withoutPoiid: `【提示】获取失败，请检查是否通过"美团外卖"小程序收藏的
 美团外卖小程序 → {{linkD}}
 
 【美团外卖福利】
 - 
 1. 点我领取美团红包1 → {{linkA}}
 - 
 2. 点我领取美团红包2 → {{linkB}}
 - 
 3. 点我领取商家券 → {{linkE}}
 - 
 4. 免配入口 → {{linkC}}
 - 
 5. 点我领取淘宝闪购红包 → {{linkF}}
 `
  },

  // 系统配置
  system: {
    // 服务器端口
    port: 80,
    // 日志级别
    logLevel: 'info',
    // 是否开启调试模式
    debug: false
  }
};

// 从环境变量加载配置
function loadConfig() {
  const config = { ...defaultConfig };
  
  // 加载关键词配置
  if (process.env.KEYWORDS) {
    try {
      const keywords = JSON.parse(process.env.KEYWORDS);
      if (Array.isArray(keywords)) {
        config.keywords = keywords;
      } else if (typeof keywords === 'object') {
        // 支持对象格式的关键词配置
        config.keywords = Object.entries(keywords).map(([keyword, reply]) => ({
          keyword,
          reply
        }));
      }
    } catch (error) {
      console.error('Failed to parse KEYWORDS environment variable:', error);
    }
  }

  // 加载默认回复
  if (process.env.DEFAULT_REPLY) {
    config.defaultReply = process.env.DEFAULT_REPLY;
  }

  // 加载美团链接配置
  const meituanLinkKeys = ['linkA', 'linkB', 'linkC', 'linkD', 'linkE', 'linkF', 'baseShopCouponLink'];
  meituanLinkKeys.forEach(key => {
    const envKey = `MEITUAN_LINKS_${key.toUpperCase()}`;
    if (process.env[envKey]) {
      config.meituanLinks[key] = process.env[envKey];
    }
  });

  // 加载模板配置
  if (process.env.TEMPLATE_WITH_POIID) {
    config.templates.withPoiid = process.env.TEMPLATE_WITH_POIID;
  }
  if (process.env.TEMPLATE_WITHOUT_POIID) {
    config.templates.withoutPoiid = process.env.TEMPLATE_WITHOUT_POIID;
  }

  // 加载系统配置
  if (process.env.PORT) {
    config.system.port = parseInt(process.env.PORT, 10) || config.system.port;
  }
  if (process.env.LOG_LEVEL) {
    config.system.logLevel = process.env.LOG_LEVEL;
  }
  if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
    config.system.debug = true;
  }

  return config;
}

// 导出配置
module.exports = loadConfig();