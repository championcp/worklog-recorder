#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整的任务管理模块测试用例导入脚本
"""

import requests
import json
import os
import sys
import re
import time

# 禁用代理
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'
os.environ['no_proxy'] = 'localhost,127.0.0.1'

def parse_js_file():
    """解析JS文件中的测试用例"""
    js_file_path = 'testCases/task.js'
    
    if not os.path.exists(js_file_path):
        print(f"❌ 找不到文件: {js_file_path}")
        return []
    
    try:
        with open(js_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取taskTestCases数组
        pattern = r'const\s+taskTestCases\s*=\s*\[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            print("❌ 未找到taskTestCases数组")
            return []
        
        # 简单解析测试用例对象
        test_cases_str = match.group(1)
        
        # 使用正则表达式提取每个测试用例
        case_pattern = r'\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
        cases = re.findall(case_pattern, test_cases_str)
        
        test_cases = []
        for i, case_str in enumerate(cases):
            try:
                # 提取基本信息
                name_match = re.search(r'name:\s*[\'"]([^\'"]*)[\'"]', case_str)
                desc_match = re.search(r'description:\s*[\'"]([^\'"]*)[\'"]', case_str)
                priority_match = re.search(r'priority:\s*[\'"]([^\'"]*)[\'"]', case_str)
                status_match = re.search(r'status:\s*[\'"]([^\'"]*)[\'"]', case_str)
                expected_match = re.search(r'expectedResult:\s*[\'"]([^\'"]*)[\'"]', case_str)
                
                # 提取测试步骤
                steps_match = re.search(r'testSteps:\s*\[(.*?)\]', case_str, re.DOTALL)
                steps = []
                if steps_match:
                    steps_str = steps_match.group(1)
                    step_matches = re.findall(r'[\'"]([^\'"]*)[\'"]', steps_str)
                    steps = step_matches
                
                test_case = {
                    'name': name_match.group(1) if name_match else f'测试用例{i+1}',
                    'description': desc_match.group(1) if desc_match else '',
                    'priority': priority_match.group(1) if priority_match else 'medium',
                    'status': status_match.group(1) if status_match else 'pending',
                    'expectedResult': expected_match.group(1) if expected_match else '',
                    'testSteps': steps
                }
                
                test_cases.append(test_case)
                
            except Exception as e:
                print(f"⚠️ 解析测试用例 {i+1} 时出错: {str(e)}")
                continue
        
        print(f"✅ 成功解析 {len(test_cases)} 个测试用例")
        return test_cases
        
    except Exception as e:
        print(f"❌ 读取JS文件失败: {str(e)}")
        return []

def get_task_module_id():
    """获取任务管理模块ID"""
    try:
        response = requests.get(
            'http://localhost:8000/api/test-cases/modules',
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            modules = data.get('data', [])
            
            for module in modules:
                if module.get('name') == '任务管理':
                    return module.get('id')
            
            print("❌ 未找到任务管理模块")
            return None
        else:
            print(f"❌ 获取模块列表失败: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 获取模块ID失败: {str(e)}")
        return None

def create_test_case(test_case, module_id):
    """创建单个测试用例"""
    # 状态值映射，确保符合数据库约束
    status_mapping = {
        'completed': 'passed',
        'published': 'passed',
        'active': 'pending',
        'inactive': 'skipped'
    }
    
    original_status = test_case.get('status', 'pending')
    mapped_status = status_mapping.get(original_status, original_status)
    
    # 确保状态值在允许的范围内
    valid_statuses = ['pending', 'passed', 'failed', 'blocked', 'skipped']
    if mapped_status not in valid_statuses:
        mapped_status = 'pending'
    
    api_data = {
        'title': test_case.get('name', ''),
        'description': test_case.get('description', ''),
        'module_id': module_id,
        'priority': test_case.get('priority', 'medium'),
        'status': mapped_status,
        'steps': test_case.get('testSteps', []),
        'expected_result': test_case.get('expectedResult', ''),
        'estimated_time': '',
        'actual_result': '',
        'executed_by': ''
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/test-cases',
            json=api_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            return True, response.json()
        else:
            return False, f"状态码: {response.status_code}, 响应: {response.text}"
            
    except Exception as e:
        return False, str(e)

def main():
    print("============================================================")
    print("任务管理模块测试用例导入脚本")
    print("============================================================")
    
    # 1. 获取任务管理模块ID
    print("\n1. 获取任务管理模块ID...")
    module_id = get_task_module_id()
    if not module_id:
        print("❌ 无法获取任务管理模块ID，退出")
        return False
    
    print(f"✅ 任务管理模块ID: {module_id}")
    
    # 2. 解析JS文件
    print("\n2. 解析JS文件中的测试用例...")
    test_cases = parse_js_file()
    if not test_cases:
        print("❌ 未找到测试用例，退出")
        return False
    
    # 3. 导入测试用例
    print(f"\n3. 开始导入 {len(test_cases)} 个测试用例...")
    success_count = 0
    failed_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n导入测试用例 {i}/{len(test_cases)}: {test_case.get('name', '未命名')}")
        
        success, result = create_test_case(test_case, module_id)
        
        if success:
            print(f"  ✅ 导入成功")
            success_count += 1
        else:
            print(f"  ❌ 导入失败: {result}")
            failed_count += 1
        
        # 短暂延迟避免请求过快
        time.sleep(0.1)
    
    # 4. 总结
    print(f"\n============================================================")
    print(f"导入完成!")
    print(f"成功: {success_count} 个")
    print(f"失败: {failed_count} 个")
    print(f"总计: {len(test_cases)} 个")
    print(f"============================================================")
    
    return failed_count == 0

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)