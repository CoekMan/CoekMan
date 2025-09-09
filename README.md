# 微信公众号自动回复系统

# 微信公众号自动回复系统

这是一个基于Node.js和Express框架开发的微信公众号自动回复系统，专为微信云托管环境设计，支持关键词回复和美团外卖小程序卡片消息处理。系统经过全面重构，采用模块化架构，具有更强的稳定性和可维护性。

## 功能特性

✅ **文本消息关键词回复**：根据配置的关键词列表自动回复对应内容
✅ **小程序卡片消息处理**：
  - 处理含poiid的美团外卖小程序卡片，自动生成带商家券的回复
  - 处理不含poiid的小程序卡片，返回提示信息和通用链接
✅ **灵活的配置系统**：所有关键词、链接和回复模板均可通过配置文件或环境变量修改
✅ **支持多用户并发**：基于Node.js异步非阻塞特性，可同时处理多个用户的请求
✅ **XML和JSON双格式支持**：兼容微信官方和云托管平台的不同消息格式
✅ **全面的错误处理**：包含完善的错误捕获和日志记录机制
✅ **模块化架构**：代码结构清晰，分为工具函数、消息处理器、中间件等独立模块

## 项目结构

```
├── index.js           # 项目入口文件（简化版）
├── config.js          # 配置文件
├── package.json       # 项目配置和依赖
├── Dockerfile         # Docker容器配置
├── .env.example       # 环境变量示例
├── README.md          # 项目说明文档
└── src/               # 源码目录
    ├── app.js         # 应用主文件
    ├── utils.js       # 工具函数（XML解析、模板渲染等）
    ├── handlers.js    # 消息处理器（文本/小程序消息处理）
    └── middlewares.js # 中间件（日志、错误处理等）
```

## 配置指南

所有配置均在`config.js`文件中进行修改：

### 1. 关键词配置

在`keywords`数组中添加或修改关键词-回复对：

```javascript
keywords: [
  { keyword: '你好', reply: '您好！欢迎使用美团外卖自动回复系统。' },
  { keyword: '帮助', reply: '发送美团外卖小程序卡片，即可获取专属福利！' },
  // 可添加更多关键词-回复对
],
```

### 2. 默认回复配置

设置未匹配到关键词时的默认回复：

```javascript
defaultReply: '感谢您的消息！请发送美团外卖小程序卡片获取专属福利，或发送"帮助"获取更多信息。其他功能请等待上线。',
```

### 3. 微信官方"网页"小程序中转配置

配置微信官方"网页"小程序中转URL模板：

```javascript
wechatWebAppConfig: {
  // 微信网页小程序中转URL模板
  // 格式: weixin://dl/business/?t=URL_ENCODED
  baseUrl: 'weixin://dl/business/?t='
},
```

系统会自动处理链接变量：
- 对于以`#小程序://`开头的小程序链接，保持原样不进行中转
- 对于普通HTTP/HTTPS链接，自动转换为微信官方"网页"小程序的跳转格式

**注意：** 如果普通链接包含在反引号(`)中，系统会自动去除反引号和前后空格后再进行处理。

### 4. 美团链接配置

修改美团相关的固定链接和基础链接：

```javascript
meituanLinks: {
  // 普通链接使用微信官方"网页"小程序中转（可选择包含在反引号中）
  linkA: ' `https://kurl01.cn/75Mx7a` ', // 美团外卖红包1
  linkB: ' `https://kurl01.cn/75Mx7f` ', // 美团外卖红包2
  // 小程序链接保持原样不中转
  linkC: '#小程序://美团外卖丨外卖美食奶茶咖啡水果/kPOfmjsimwLLIxC', // 免配入口
  linkD: '#小程序://美团外卖丨外卖美食奶茶咖啡水果/AM0JMCilcHUdQMp', // 美团外卖小程序
  // 商家券领取链接（普通链接，使用微信官方"网页"小程序中转）
  linkE: ' `https://offsiteact.meituan.com/web/hoae/collection_waimai_v8/index.html?recallBizId=cpsH5Coupon&bizId=224ac1afd8674632ae7b85226f192d82&mediumSrc1=224ac1afd8674632ae7b85226f192d82&scene=CPS_SELF_SRC&pageSrc1=CPS_SELF_OUT_SRC_H5_LINK&pageSrc2=224ac1afd8674632ae7b85226f192d82&pageSrc3=f9f5776e716941fdaba720b243525425&activityId=6&mediaPvId=dafkdsajffjafdfs&mediaUserId=10086&outActivityId=6&hoaePageV=8&p=1006228694084128768` ', // 商家券领取固定链接
  // 商家券基础链接（普通链接，使用微信官方"网页"小程序中转）
  baseShopCouponLink: ' `https://offsiteact.meituan.com/web/hoae/collection_waimai_v8/index.html?recallBizId=cpsH5Coupon&bizId=224ac1afd8674632ae7b85226f192d82&mediumSrc1=224ac1afd8674632ae7b85226f192d82&scene=CPS_SELF_SRC&pageSrc1=CPS_SELF_OUT_SRC_H5_LINK&pageSrc2=224ac1afd8674632ae7b85226f192d82&pageSrc3=f9f5776e716941fdaba720b243525425&activityId=6&mediaPvId=dafkdsajffjafdfs&mediaUserId=10086&outActivityId=6&hoaePageV=8&p=1006228694084128768` ' // 商家券基础链接
},
```

### 4. 回复模板配置

修改回复消息的排版模板：

```javascript
templates: {
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
}
```

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务将在端口80启动（可通过环境变量PORT修改）。

## 部署到微信云托管

项目已包含Dockerfile，可直接在微信云托管环境中部署。

1. 确保已在微信公众平台配置好服务器地址（URL）和Token
2. 将代码上传到代码仓库（如GitHub、GitLab等）
3. 登录微信云托管控制台（https://cloud.weixin.qq.com/cloudrun）
4. 创建新项目，选择Node.js环境
5. 配置部署参数，关联代码仓库
6. 系统会自动识别并使用项目中的Dockerfile进行构建部署
7. 等待部署完成，配置域名解析

## 微信公众号配置

1. 登录微信公众平台
2. 进入"开发" -> "基本配置"
3. 启用服务器配置，填写服务器地址（URL）、Token
4. 配置消息加解密方式（可选）
5. 提交配置，等待验证通过

## 注意事项

1. 微信服务器要求在5秒内返回响应，否则会重试请求
2. 所有回复内容必须是纯文本格式
3. 配置文件中的链接需要是微信内可打开的合规链接
4. 关键词匹配按配置顺序进行，先配置的关键词优先匹配

## 环境变量配置

系统支持通过环境变量覆盖配置文件中的设置，这样您可以在微信云托管平台上方便地修改参数而不需要重新部署代码。

### 支持的环境变量

| 环境变量名 | 对应配置项 | 说明 |
|------------|------------|------|
| KEYWORDS | keywords | 关键词配置（需要是JSON格式字符串） |
| DEFAULT_REPLY | defaultReply | 默认回复文本 |
| MEITUAN_LINKS_LINKA | meituanLinks.linkA | 美团外卖红包1链接 |
| MEITUAN_LINKS_LINKB | meituanLinks.linkB | 美团外卖红包2链接 |
| MEITUAN_LINKS_LINKC | meituanLinks.linkC | 免配入口小程序链接 |
| MEITUAN_LINKS_LINKD | meituanLinks.linkD | 美团外卖小程序链接 |
| MEITUAN_LINKS_LINKE | meituanLinks.linkE | 商家券领取固定链接 |
| MEITUAN_LINKS_LINKF | meituanLinks.linkF | 淘宝闪购红包链接 |
| MEITUAN_LINKS_BASESHOPCOUPONLINK | meituanLinks.baseShopCouponLink | 商家券基础链接 |
| WECHAT_WEB_APP_CONFIG_BASEURL | wechatWebAppConfig.baseUrl | 微信官方"网页"小程序中转URL模板 |

### 微信云托管平台配置示例

在微信云托管平台的环境变量配置中，您可以这样填写：

```json
{
  "DEFAULT_REPLY": "感谢您的消息！请发送美团外卖小程序卡片获取专属福利。",
  "MEITUAN_LINKS_LINKA": " `https://kurl01.cn/75Mx7a` ",
  "MEITUAN_LINKS_LINKB": " `https://kurl01.cn/75Mx7f` "
}
```

对于复杂的JSON配置（如keywords），需要使用转义后的JSON字符串：

```json
{
  "KEYWORDS": "[{\"keyword\": \"测试\", \"reply\": \"测试完成\"}]"
}

## License

ISC