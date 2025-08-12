#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import re
import os

# API配置
API_BASE_URL = 'http://localhost:8000/api'

def get_module_id_by_name(module_name):
    """根据模块名获取模块ID"""
    try:
        response = requests.get(f'{API_BASE_URL}/test-cases/modules')
        if response.status_code == 200:
            result = response.json()
            modules = result.get('data', [])
            for module in modules:
                if module['name'] == module_name:
                    return module['id']
        return None
    except Exception as e:
        print(f"获取模块ID失败: {e}")
        return None

def parse_single_test_case(test_case_str):
    """解析单个测试用例对象"""
    test_case = {}
    
    # 提取基本字段
    patterns = {
        'id': r"id:\s*['\"]([^'\"]+)['\"]",
        'name': r"name:\s*['\"]([^'\"]+)['\"]",
        'description': r"description:\s*['\"]([^'\"]+)['\"]",
        'module': r"module:\s*['\"]([^'\"]+)['\"]",
        'priority': r"priority:\s*['\"]([^'\"]+)['\"]",
        'status': r"status:\s*['\"]([^'\"]+)['\"]",
        'apiEndpoint': r"apiEndpoint:\s*['\"]([^'\"]+)['\"]",
        'actualResult': r"actualResult:\s*['\"]([^'\"]*)['\"]",
        'executionTime': r"executionTime:\s*(\d+)",
        'lastExecuted': r"lastExecuted:\s*(null|['\"][^'\"]*['\"])"
    }
    
    for field, pattern in patterns.items():
        match = re.search(pattern, test_case_str)
        if match:
            value = match.group(1)
            if field in ['executionTime']:
                test_case[field] = int(value) if value.isdigit() else 0
            elif field == 'lastExecuted' and value == 'null':
                test_case[field] = None
            else:
                test_case[field] = value
    
    # 提取数组字段
    test_steps_match = re.search(r"testSteps:\s*\[(.*?)\]", test_case_str, re.DOTALL)
    if test_steps_match:
        steps_content = test_steps_match.group(1)
        steps = re.findall(r"['\"]([^'\"]+)['\"]", steps_content)
        test_case['testSteps'] = steps
    
    # 提取expectedResult
    expected_result_match = re.search(r"expectedResult:\s*['\"]([^'\"]+)['\"]", test_case_str)
    if expected_result_match:
        test_case['expectedResult'] = expected_result_match.group(1)
    
    # 提取testData对象
    test_data_match = re.search(r"testData:\s*\{(.*?)\}", test_case_str, re.DOTALL)
    if test_data_match:
        test_data_content = test_data_match.group(1)
        test_data = {}
        
        # 简单的键值对提取
        kv_matches = re.findall(r"(\w+):\s*['\"]([^'\"]*)['\"]", test_data_content)
        for key, value in kv_matches:
            test_data[key] = value
            
        # 处理特殊情况，如new Date()
        date_matches = re.findall(r"(\w+):\s*new Date\(\)\.toISOString\(\)", test_data_content)
        for key in date_matches:
            test_data[key] = "2024-01-01T00:00:00.000Z"
            
        test_case['testData'] = test_data
    else:
        test_case['testData'] = {}
    
    return test_case

def extract_test_cases_from_js(file_path):
    """从JS文件中提取测试用例"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找测试用例数组
        array_pattern = r'const\s+\w*[Tt]est[Cc]ases\s*=\s*\[(.*?)\];'
        match = re.search(array_pattern, content, re.DOTALL)
        
        if not match:
            print(f"在文件 {file_path} 中未找到测试用例数组")
            return []
        
        array_content = match.group(1)
        
        # 分割测试用例对象
        test_cases = []
        brace_count = 0
        current_case = ""
        in_string = False
        escape_next = False
        string_char = None
        
        for char in array_content:
            if escape_next:
                current_case += char
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                current_case += char
                continue
            
            if not in_string and char in ['"', "'"]:
                in_string = True
                string_char = char
            elif in_string and char == string_char:
                in_string = False
                string_char = None
            
            current_case += char
            
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        # 完整的测试用例对象
                        test_case = parse_single_test_case(current_case)
                        if test_case.get('id'):
                            test_cases.append(test_case)
                        current_case = ""
        
        return test_cases
        
    except Exception as e:
        print(f"解析文件 {file_path} 失败: {e}")
        return []

def create_test_case_via_api(test_case_data):
    """通过API创建测试用例"""
    try:
        response = requests.post(f'{API_BASE_URL}/test-cases', json=test_case_data)
        
        if response.status_code in [200, 201]:
            return True, "创建成功"
        else:
            try:
                error_data = response.json()
                return False, f"状态码: {response.status_code}, 错误: {error_data}"
            except:
                return False, f"状态码: {response.status_code}, 响应: {response.text}"
    except Exception as e:
        return False, f"请求异常: {str(e)}"

def debug_task_import():
    """调试任务管理模块的导入问题"""
    print("============================================================")
    print("调试任务管理模块测试用例导入问题")
    print("============================================================")
    
    # 1. 检查任务管理模块是否存在
    print("\n1. 检查任务管理模块...")
    task_module_id = get_module_id_by_name('任务管理')
    if task_module_id:
        print(f"  ✓ 找到任务管理模块，ID: {task_module_id}")
    else:
        print("  ✗ 未找到任务管理模块")
        return
    
    # 2. 解析task.js文件
    print("\n2. 解析task.js文件...")
    js_file_path = os.path.join(os.getcwd(), 'testCases', 'task.js')
    test_cases = extract_test_cases_from_js(js_file_path)
    print(f"  ✓ 从task.js中提取到 {len(test_cases)} 个测试用例")
    
    # 3. 逐个尝试导入测试用例
    print("\n3. 逐个尝试导入测试用例...")
    success_count = 0
    failed_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n导入 {i}/{len(test_cases)}: {test_case.get('name', 'Unknown')}")
        
        # 准备API数据
        api_data = {
            'title': test_case.get('name', ''),
            'description': test_case.get('description', ''),
            'module_id': task_module_id,
            'priority': test_case.get('priority', 'medium'),
            'status': test_case.get('status', 'pending'),
            'steps': test_case.get('testSteps', []),
            'expected_result': test_case.get('expectedResult', ''),
            'estimated_time': '',
            'actual_result': test_case.get('actualResult', ''),
            'executed_by': ''
        }
        
        print(f"  测试用例数据: {json.dumps(api_data, ensure_ascii=False, indent=2)}")
        
        success, message = create_test_case_via_api(api_data)
        if success:
            print(f"  ✓ 导入成功")
            success_count += 1
        else:
            print(f"  ✗ 导入失败: {message}")
            failed_count += 1
    
    print(f"\n导入完成:")
    print(f"  成功导入: {success_count}")
    print(f"  导入失败: {failed_count}")
    print(f"  总计处理: {len(test_cases)}")

if __name__ == '__main__':
    debug_task_import()