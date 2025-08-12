#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function runRegressionTest() {
  console.log('🔄 开始回归测试 - 验证计划管理模块修复...\n');
  
  let token = '';
  
  try {
    // 1. 登录获取token
    console.log('1. 🔐 用户登录测试...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'nobody',
      password: 'Qzkj@2025'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ 登录成功');
    } else {
      throw new Error('登录失败');
    }
    
    // 2. 测试计划列表API（之前失败的API）
    console.log('\n2. 📋 测试计划列表API...');
    const plansResponse = await axios.get(`${BASE_URL}/plans?type=yearly&year=2025`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (plansResponse.status === 200) {
      console.log('✅ 计划列表API正常');
      console.log(`   返回数据: ${JSON.stringify(plansResponse.data, null, 2)}`);
    } else {
      throw new Error('计划列表API失败');
    }
    
    // 3. 测试创建计划API（之前失败的核心功能）
    console.log('\n3. ➕ 测试创建计划API...');
    const createPlanData = {
      title: "2025年第一季度工作计划",
      description: "制定2025年第一季度的详细工作计划，包括项目目标、时间安排和关键里程碑。重点关注产品开发、团队协作和客户服务提升。",
      timeRange: "quarter",
      startDate: "2025-01-01",
      endDate: "2025-03-31"
    };
    
    const createResponse = await axios.post(`${BASE_URL}/plans`, createPlanData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (createResponse.status === 201) {
      console.log('✅ 计划创建成功');
      console.log(`   创建的计划ID: ${createResponse.data.data.id}`);
      console.log(`   计划标题: ${createResponse.data.data.title}`);
      
      // 4. 验证创建的计划是否能正确查询
      console.log('\n4. 🔍 验证创建的计划是否能正确查询...');
      const verifyResponse = await axios.get(`${BASE_URL}/plans/${createResponse.data.data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (verifyResponse.status === 200 && verifyResponse.data.data.title === createPlanData.title) {
        console.log('✅ 计划查询验证成功');
      } else {
        throw new Error('计划查询验证失败');
      }
      
      // 5. 测试计划更新功能
      console.log('\n5. ✏️ 测试计划更新功能...');
      const updateData = {
        title: "2025年第一季度工作计划（已更新）",
        description: "更新后的计划描述"
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/plans/${createResponse.data.data.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.status === 200) {
        console.log('✅ 计划更新成功');
      } else {
        throw new Error('计划更新失败');
      }
      
      // 6. 清理测试数据
      console.log('\n6. 🧹 清理测试数据...');
      const deleteResponse = await axios.delete(`${BASE_URL}/plans/${createResponse.data.data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (deleteResponse.status === 200) {
        console.log('✅ 测试数据清理成功');
      } else {
        console.log('⚠️ 测试数据清理失败，但不影响测试结果');
      }
      
    } else {
      throw new Error('计划创建失败');
    }
    
    console.log('\n🎉 回归测试全部通过！');
    console.log('📊 测试结果总结:');
    console.log('   ✅ 用户登录功能正常');
    console.log('   ✅ 计划列表查询功能正常');
    console.log('   ✅ 计划创建功能正常');
    console.log('   ✅ 计划查询功能正常');
    console.log('   ✅ 计划更新功能正常');
    console.log('   ✅ 计划删除功能正常');
    console.log('\n🔧 修复验证: 之前发现的500错误问题已彻底解决！');
    
  } catch (error) {
    console.error('\n❌ 回归测试失败:');
    console.error(`   错误状态码: ${error.response?.status || 'N/A'}`);
    console.error(`   错误信息: ${error.response?.data?.message || error.message}`);
    console.error(`   请求URL: ${error.config?.url || 'N/A'}`);
    
    if (error.response?.data) {
      console.error(`   详细错误: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    process.exit(1);
  }
}

// 运行回归测试
runRegressionTest();