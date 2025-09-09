// 微信公众号自动回复系统 - 重构版
const express = require('express');

// 初始化Express应用
const app = express();

// 加载配置
const config = require('../config');

// 导入工具函数
const { parseXml, buildReplyXml, extractPoiid, renderTemplate, setNestedProperty, overrideConfigWithEnvVars } = require('./utils');

// 导入消息处理器
const { handleTextMessage, handleMiniprogramMessage, processMessage } = require('./handlers');

// 导入中间件
const { globalErrorHandler, notFoundHandler, requestLogger } = require('./middlewares');

// 执行配置覆盖
overrideConfigWithEnvVars();

// 设置端口
const PORT = process.env.PORT || 80;

// ==============================================
// 中间件配置
// ==============================================

// 日志中间件
app.use(requestLogger);

// 设置中间件处理请求数据
app.use(express.json({ limit: '1mb' })); // 首先添加JSON解析器，支持微信云托管的JSON格式
app.use(express.text({ type: '*/xml', limit: '1mb' })); // 处理XML格式消息
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // 处理表单数据

// ==============================================
// 路由配置
// ==============================================

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 微信消息接收接口 - 支持XML和JSON格式
app.post('/webhook', async (req, res) => {
  try {
    console.log('[Webhook] 收到微信消息请求');
    
    // 记录请求体的类型和前100个字符，以便调试
    console.log(`[Webhook] 请求体类型: ${typeof req.body}`);
    console.log(`[Webhook] 请求体预览: ${JSON.stringify(req.body).substring(0, 100)}...`);
    
    // 处理请求体，支持XML字符串和JSON对象两种格式
    let message;
    if (typeof req.body === 'string') {
      // 尝试作为XML解析
      message = parseXml(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      // 已经是JSON对象，直接使用
      message = req.body;
      console.log('[Webhook] 收到JSON格式消息');
    }
    
    if (!message) {
      console.warn('[Webhook] 无效的消息格式');
      // 返回默认回复，而不是400错误，避免微信平台重试
      const defaultReply = config.defaultReply || '感谢您的消息！';
      res.status(200).json({
        ToUserName: req.body?.FromUserName || req.body?.fromUserName || '',
        FromUserName: req.body?.ToUserName || req.body?.toUserName || '',
        CreateTime: Math.floor(Date.now() / 1000),
        MsgType: 'text',
        Content: defaultReply
      });
      return;
    }
    
    // 处理消息并获取回复
    const replyContent = processMessage(message);
    
    // 根据消息类型决定返回格式
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('xml')) {
      // XML格式请求，返回XML
      const replyXml = buildReplyXml(message, replyContent);
      res.set('Content-Type', 'application/xml');
      res.send(replyXml);
    } else {
      // 其他格式（如JSON），返回JSON
      res.status(200).json({
        ToUserName: message.FromUserName || message.fromUserName || '',
        FromUserName: message.ToUserName || message.toUserName || '',
        CreateTime: Math.floor(Date.now() / 1000),
        MsgType: 'text',
        Content: replyContent
      });
    }
    
    console.log('[Webhook] 消息处理完成');
  } catch (error) {
    console.error('[Webhook处理错误]', error);
    console.error('[Webhook] 错误详情:', error.message);
    console.error('[Webhook] 错误堆栈:', error.stack);
    
    try {
      // 安全地记录请求体内容
      const requestBodyPreview = req.body ? 
        (typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)) : 
        '请求体为空';
      console.error('[Webhook] 请求体预览:', requestBodyPreview);
    } catch (logError) {
      console.error('[Webhook日志错误] 无法记录请求体:', logError);
    }
    
    // 安全获取用户名信息，支持微信云托管平台格式
    let toUserName = '';
    let fromUserName = '';
    
    try {
      if (req.body) {
        toUserName = req.body.FromUserName || req.body.fromUserName || '';
        fromUserName = req.body.ToUserName || req.body.toUserName || '';
      }
    } catch (userError) {
      console.error('[Webhook用户信息错误]', userError);
    }
    
    // 即使出错，也返回200响应避免微信重试
    res.status(200).json({
      ToUserName: toUserName,
      FromUserName: fromUserName,
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: 'text',
      Content: config.defaultReply || '感谢您的消息！'
    });
  }
});

// 用于验证的GET接口（微信公众号配置时需要）
app.get('/webhook', (req, res) => {
  try {
    console.log('[验证接口] 收到验证请求');
    
    // 微信服务器验证
    const { echostr } = req.query;
    if (echostr) {
      console.log('[验证接口] 返回echostr');
      res.send(echostr);
    } else {
      res.send('Welcome to WeChat Auto Reply System');
    }
  } catch (error) {
    console.error('[验证接口错误]', error);
    res.status(500).send('Internal Server Error');
  }
});

// 404 错误处理
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

// ==============================================
// 启动服务器
// ==============================================

/**
 * 启动HTTP服务器
 * @param {number} port - 端口号
 * @returns {Promise<http.Server>} 服务器实例
 */
function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`[服务器] 微信自动回复系统已启动，监听端口：${port}`);
      console.log(`[服务器] 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[服务器] Webhook地址: http://localhost:${port}/webhook`);
      resolve(server);
    });
    
    server.on('error', (error) => {
      console.error('[服务器启动错误]', error);
      reject(error);
    });
  });
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[未捕获异常]', error);
  console.error('[未捕获异常] 堆栈:', error.stack);
  // 在生产环境中，可以选择优雅退出或继续运行
  // process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('[未处理的Promise拒绝]', reason);
  console.error('[未处理的Promise拒绝] 堆栈:', reason?.stack);
});

// 导出app和启动函数供测试和其他模块使用
module.exports = {
  app,
  startServer,
  PORT
};