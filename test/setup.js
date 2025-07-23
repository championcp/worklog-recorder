// Jest测试设置文件
const { TextEncoder, TextDecoder } = require('util');

// 设置全局变量
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 设置测试超时时间
jest.setTimeout(30000);

console.log('Jest测试环境设置完成');