// 微信自动回复系统 - 中间件模块

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 记录请求信息
  console.log(`[请求日志] ${requestId} - ${req.method} ${req.path}`);
  
  // 记录请求头（仅记录关键信息，避免敏感信息）
  const safeHeaders = {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'accept': req.headers['accept']
  };
  console.log(`[请求日志] ${requestId} - 请求头:`, safeHeaders);
  
  // 记录请求参数
  if (Object.keys(req.query).length > 0) {
    console.log(`[请求日志] ${requestId} - 查询参数:`, req.query);
  }
  
  // 记录请求体（仅记录预览，避免大文件）
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      // 限制日志大小，避免记录过大的请求体
      const bodyPreview = JSON.stringify(req.body).substring(0, 500);
      console.log(`[请求日志] ${requestId} - 请求体预览: ${bodyPreview}${req.body.length > 500 ? '...' : ''}`);
    } catch (e) {
      console.log(`[请求日志] ${requestId} - 请求体无法序列化`);
    }
  }
  
  // 监听响应完成事件
  res.on('finish', () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`[请求日志] ${requestId} - 状态码: ${res.statusCode}, 响应时间: ${responseTime}ms`);
  });
  
  next();
}

/**
 * JSON解析错误处理中间件
 */
function jsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[JSON解析错误] 无效的JSON格式:', err.message);
    
    // 捕获并格式化请求体预览（如果有）
    let bodyPreview = '未知';
    if (req.body && typeof req.body === 'string') {
      bodyPreview = req.body.substring(0, 200) + (req.body.length > 200 ? '...' : '');
    }
    
    console.error(`[JSON解析错误] 请求体预览: ${bodyPreview}`);
    
    // 根据请求的Content-Type返回不同格式的错误
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid JSON format',
        message: 'Request body contains invalid JSON syntax',
        code: 'INVALID_JSON'
      });
    } else {
      return res.status(400).send('Invalid request body format');
    }
  }
  
  next(err);
}

/**
 * 404错误处理中间件
 */
function notFoundHandler(req, res, next) {
  console.warn(`[404错误] 路径未找到: ${req.method} ${req.path}`);
  
  // 根据请求的Accept头返回不同格式的404响应
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    });
  } else {
    res.status(404).send('Page Not Found');
  }
}

/**
 * 全局错误处理中间件
 */
function globalErrorHandler(err, req, res, next) {
  // 确保错误信息不会暴露给客户端
  const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.error(`[全局错误] ${errorId} - 错误类型:`, err.name);
  console.error(`[全局错误] ${errorId} - 错误信息:`, err.message);
  console.error(`[全局错误] ${errorId} - 错误堆栈:`, err.stack);
  
  // 记录请求上下文信息
  console.error(`[全局错误] ${errorId} - 请求路径: ${req.method} ${req.path}`);
  
  // 安全获取用户信息（如果有）
  let userName = '未知';
  if (req.body && (req.body.FromUserName || req.body.fromUserName)) {
    userName = req.body.FromUserName || req.body.fromUserName;
    // 对用户名进行脱敏处理
    const maskedUserName = userName.substring(0, 3) + '****' + userName.substring(userName.length - 3);
    console.error(`[全局错误] ${errorId} - 用户信息: ${maskedUserName}`);
  }
  
  // 根据请求类型返回不同格式的错误响应
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      errorId: errorId,
      code: 'SERVER_ERROR'
    });
  } else {
    res.status(500).send(`Internal Server Error (Error ID: ${errorId})`);
  }
}

/**
 * 微信公众号验证中间件
 */
function wechatVerification(req, res, next) {
  if (req.method === 'GET' && req.path === '/api/webhook') {
    const { signature, timestamp, nonce, echostr } = req.query;
    
    console.log(`[微信验证] 收到验证请求，参数:`, {
      signature: signature ? '存在' : '不存在',
      timestamp: timestamp,
      nonce: nonce,
      echostr: echostr ? '存在' : '不存在'
    });
    
    // 在生产环境中，这里应该验证signature
    // 为了简化，这里直接返回echostr
    if (echostr) {
      console.log(`[微信验证] 验证通过，返回echostr`);
      return res.send(echostr);
    } else {
      console.warn(`[微信验证] 验证失败，缺少echostr参数`);
      return res.status(400).send('Invalid verification request');
    }
  }
  
  next();
}

/**
 * 健康检查中间件
 */
function healthCheckMiddleware(req, res) {
  try {
    // 检查应用基本状态
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version
    };
    
    console.log(`[健康检查] 应用状态:`, healthStatus);
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error(`[健康检查错误]`, error);
    
    res.status(503).json({
      status: 'DOWN',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 导出所有中间件
module.exports = {
  requestLogger,
  jsonErrorHandler,
  notFoundHandler,
  globalErrorHandler,
  wechatVerification,
  healthCheckMiddleware
};