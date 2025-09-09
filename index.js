// 微信公众号自动回复系统 - 入口文件
// 此文件作为简单的入口点，实际功能已重构到src目录下的模块中

// 加载环境变量
require('dotenv').config();

// 引入重构后的应用主文件
const app = require('./src/app');

module.exports = app;