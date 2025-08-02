#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function verifyFix() {
  console.log('🔍 验证API修复...\n');
  
  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.status);
    
    // 2. 登录获取token
    console.log('\n2. 登录获取token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'nobody',
      password: 'Qzkj@2025'
    });
    console.log('✅ 登录成功:', loginResponse.status);
    const token = loginResponse.data.token;
    
    // 3. 测试年度计划API
    console.log('\n3. 测试年度计划API...');
    const yearlyResponse = await axios.get(`${BASE_URL}/plans?type=yearly&year=2025`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 年度计划API正常:', yearlyResponse.status);
    console.log('   返回数据:', yearlyResponse.data);
    
    // 4. 测试月度计划API
    console.log('\n4. 测试月度计划API...');
    const monthlyResponse = await axios.get(`${BASE_URL}/plans?type=monthly&year=2025&month=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 月度计划API正常:', monthlyResponse.status);
    console.log('   返回数据:', monthlyResponse.data);
    
    // 5. 测试周计划API
    console.log('\n5. 测试周计划API...');
    const weeklyResponse = await axios.get(`${BASE_URL}/plans?type=weekly&year=2025&month=1&week=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 周计划API正常:', weeklyResponse.status);
    console.log('   返回数据:', weeklyResponse.data);
    
    // 6. 测试日计划API
    console.log('\n6. 测试日计划API...');
    const dailyResponse = await axios.get(`${BASE_URL}/plans?type=daily&year=2025&month=1&day=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 日计划API正常:', dailyResponse.status);
    console.log('   返回数据:', dailyResponse.data);
    
    console.log('\n🎉 所有API测试通过！数据库问题已修复！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  }
}

verifyFix();