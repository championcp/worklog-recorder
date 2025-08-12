#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的任务管理模块测试用例导入脚本
"""

import requests
import json
import os
import sys

# 禁用代理
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'
os.environ['no_proxy'] = 'localhost,127.0.0.1'

def test_single_case():
    """测试创建单个任务测试用例"""
    
    # 测试用例数据
    test_case_data = {
        "title": "创建新任务功能测试",
        "description": "验证用户能够成功创建新的工作任务",
        "module_id": 3,
        "priority": "high",
        "status": "passed",
        "steps": [
            "1. 点击\"新建任务\"按钮",
            "2. 填写任务标题: \"完成项目文档编写\"",
            "3. 填写任务描述",
            "4. 设置任务优先级为\"高\"",
            "5. 点击\"保存\"按钮"
        ],
        "expected_result": "任务创建成功，显示在任务列表中",
        "estimated_time": "",
        "actual_result": "",
        "executed_by": ""
    }
    
    try:
        print("正在创建测试用例...")
        print(f"数据: {json.dumps(test_case_data, ensure_ascii=False, indent=2)}")
        
        response = requests.post(
            'http://localhost:8000/api/test-cases',
            json=test_case_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ 测试用例创建成功!")
            return True
        else:
            print(f"❌ 测试用例创建失败: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("============================================================")
    print("简化的任务管理模块测试用例导入测试")
    print("============================================================")
    
    success = test_single_case()
    
    if success:
        print("\n🎉 测试成功!")
    else:
        print("\n💥 测试失败!")
        sys.exit(1)