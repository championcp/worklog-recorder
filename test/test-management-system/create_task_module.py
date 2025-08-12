#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

# API配置
API_BASE_URL = 'http://localhost:8000/api'

def create_task_module():
    """创建任务管理模块"""
    print("============================================================")
    print("创建任务管理模块")
    print("============================================================")
    
    # 任务管理模块数据
    module_data = {
        'name': '任务管理',
        'description': '工作任务的创建、编辑、删除和管理功能',
        'color': '#28a745',
        'icon': '📋'
    }
    
    try:
        response = requests.post(f'{API_BASE_URL}/test-cases/modules', json=module_data)
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✓ 任务管理模块创建成功")
            print(f"  模块ID: {result['data']['id']}")
            print(f"  模块名称: {result['data']['name']}")
            return result['data']['id']
        else:
            print(f"✗ 创建失败: {response.status_code}")
            print(f"  响应: {response.text}")
            return None
    except Exception as e:
        print(f"✗ 创建异常: {e}")
        return None

if __name__ == '__main__':
    create_task_module()