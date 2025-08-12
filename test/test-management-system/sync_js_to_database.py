#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
同步JS测试用例数据到数据库
"""

import os
import re
import json
import requests
import sqlite3
from typing import List, Dict, Any, Optional

# 导入配置管理器
try:
    from config import get_api_base_url, get_api_url, get_config
    API_BASE_URL = get_api_base_url()
except ImportError:
    # 如果配置模块不可用，使用默认配置
    API_BASE_URL = "http://localhost:8000/api"
    def get_api_url(endpoint):
        return f'{API_BASE_URL}{endpoint}'

DB_PATH = "test_management.db"

def get_database_test_cases():
    """从API获取数据库中的测试用例"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/test-cases", timeout=10)
        if response.status_code == 200:
            data = response.json()
            # API返回格式是 {"data": [...]}
            if isinstance(data, dict) and 'data' in data:
                return data['data']
            elif isinstance(data, list):
                return data
            else:
                print(f"意外的API响应格式: {type(data)}")
                return []
        else:
            print(f"API请求失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取数据库数据失败: {e}")
        return []

def parse_js_file(file_path):
    """解析JS文件中的测试用例"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找测试用例数组
        patterns = [
            r'const\s+\w*[Tt]est[Cc]ases\s*=\s*(\[[\s\S]*?\]);',
            r'let\s+\w*[Tt]est[Cc]ases\s*=\s*(\[[\s\S]*?\]);',
            r'var\s+\w*[Tt]est[Cc]ases\s*=\s*(\[[\s\S]*?\]);'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                array_content = match.group(1)
                # 简单的对象计数
                object_count = array_content.count('{')
                return object_count, array_content
        
        return 0, ""
    except Exception as e:
        print(f"解析文件 {file_path} 失败: {e}")
        return 0, ""

def extract_test_cases_from_js(file_path):
    """从JS文件中提取完整的测试用例数据"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找测试用例数组的开始
        patterns = [
            r'const\s+(\w*[Tt]est[Cc]ases)\s*=\s*\[',
            r'let\s+(\w*[Tt]est[Cc]ases)\s*=\s*\[',
            r'var\s+(\w*[Tt]est[Cc]ases)\s*=\s*\['
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                var_name = match.group(1)
                start_pos = match.end() - 1  # 回到 '[' 位置
                
                # 找到匹配的 ']'
                bracket_count = 0
                end_pos = start_pos
                for i, char in enumerate(content[start_pos:]):
                    if char == '[':
                        bracket_count += 1
                    elif char == ']':
                        bracket_count -= 1
                        if bracket_count == 0:
                            end_pos = start_pos + i + 1
                            break
                
                array_content = content[start_pos:end_pos]
                
                # 简单解析：计算对象数量和提取基本信息
                test_cases = []
                
                # 使用正则表达式提取每个测试用例对象
                object_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
                
                # 更复杂的对象匹配，处理嵌套
                brace_count = 0
                current_object = ""
                in_object = False
                in_string = False
                string_char = None
                escape_next = False
                
                for char in array_content[1:-1]:  # 跳过开头和结尾的 []
                    if escape_next:
                        current_object += char
                        escape_next = False
                        continue
                    
                    if char == '\\':
                        escape_next = True
                        current_object += char
                        continue
                    
                    if not in_string and char in ['"', "'", '`']:
                        in_string = True
                        string_char = char
                        current_object += char
                        continue
                    
                    if in_string and char == string_char:
                        in_string = False
                        string_char = None
                        current_object += char
                        continue
                    
                    if in_string:
                        current_object += char
                        continue
                    
                    if char == '{':
                        if not in_object:
                            in_object = True
                            current_object = ""
                        brace_count += 1
                        current_object += char
                    elif char == '}':
                        brace_count -= 1
                        current_object += char
                        if brace_count == 0 and in_object:
                            # 解析这个对象
                            test_case = parse_single_test_case(current_object)
                            if test_case:
                                test_cases.append(test_case)
                            current_object = ""
                            in_object = False
                    elif in_object:
                        current_object += char
                
                return test_cases
        
        return []
    except Exception as e:
        print(f"提取文件 {file_path} 中的测试用例失败: {e}")
        return []

def parse_single_test_case(obj_str):
    """解析单个测试用例对象字符串"""
    try:
        test_case = {}
        
        # 提取基本字段
        fields = {
            'id': r"id\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'title': r"title\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'description': r"description\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'expected': r"expected\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'status': r"status\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'priority': r"priority\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'estimatedTime': r"estimatedTime\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'executedBy': r"executedBy\s*:\s*['\"`]([^'\"`]*)['\"`]",
            'notes': r"notes\s*:\s*['\"`]([^'\"`]*)['\"`]"
        }
        
        for field, pattern in fields.items():
            match = re.search(pattern, obj_str)
            if match:
                test_case[field] = match.group(1)
        
        # 处理数组字段 steps
        steps_match = re.search(r"steps\s*:\s*\[(.*?)\]", obj_str, re.DOTALL)
        if steps_match:
            steps_content = steps_match.group(1)
            steps = re.findall(r"['\"`]([^'\"`]*)['\"`]", steps_content)
            test_case['steps'] = '\n'.join(steps)
        
        # 处理可能包含模板字符串的字段
        for field in ['actualResult', 'description', 'expected']:
            # 尝试匹配模板字符串
            template_pattern = f"{field}\\s*:\\s*`([^`]*)`"
            match = re.search(template_pattern, obj_str, re.DOTALL)
            if match:
                test_case[field] = match.group(1).strip()
            elif field not in test_case:
                # 尝试普通字符串
                normal_pattern = f"{field}\\s*:\\s*['\"]([^'\"]*)['\"]"
                match = re.search(normal_pattern, obj_str)
                if match:
                    test_case[field] = match.group(1)
        
        return test_case if test_case else None
    except Exception as e:
        print(f"解析测试用例对象失败: {e}")
        return None

def get_module_id_by_name(module_name):
    """根据模块名获取模块ID"""
    module_mapping = {
        '用户认证': 1,
        '仪表板': 2,
        '任务管理': 3,
        '分类管理': 4,
        '标签管理': 5,
        '计划管理': 6,
        '时间记录': 7,
        '工作日志': 8,
        '统计分析': 9,
        '报告管理': 10,
        '设置': 11
    }
    return module_mapping.get(module_name, 1)

def create_test_case_via_api(test_case_data):
    """通过API创建测试用例"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/test-cases",
            json=test_case_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        # 200和201都表示成功
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"创建测试用例失败: {response.status_code}, {response.text}")
            return None
    except Exception as e:
        print(f"API请求失败: {e}")
        return None

def sync_js_to_database():
    """同步JS文件到数据库"""
    print("=" * 60)
    print("同步JS文件测试用例到数据库")
    print("=" * 60)
    
    # 获取现有数据库数据
    print("\n1. 获取现有数据库数据...")
    existing_cases = get_database_test_cases()
    existing_ids = {case['id'] for case in existing_cases}
    print(f"数据库中现有测试用例: {len(existing_cases)} 个")
    
    # 文件和模块映射
    file_module_mapping = {
        'auth.js': '用户认证',
        'dashboard.js': '仪表板',
        'task.js': '任务管理',
        'category.js': '分类管理',
        'tag.js': '标签管理',
        'plan.js': '计划管理',
        'time.js': '时间记录',
        'log.js': '工作日志',
        'statistics.js': '统计分析',
        'report.js': '报告管理',
        'settings.js': '设置'
    }
    
    testcases_dir = "testCases"
    total_added = 0
    total_skipped = 0
    
    print("\n2. 处理JS文件...")
    
    for js_file, module_name in file_module_mapping.items():
        file_path = os.path.join(testcases_dir, js_file)
        if not os.path.exists(file_path):
            print(f"  跳过不存在的文件: {js_file}")
            continue
        
        print(f"\n  处理文件: {js_file} -> {module_name}")
        
        # 提取测试用例
        test_cases = extract_test_cases_from_js(file_path)
        print(f"    找到 {len(test_cases)} 个测试用例")
        
        module_id = get_module_id_by_name(module_name)
        
        for i, case in enumerate(test_cases):
            # 检查是否已存在（基于ID）
            case_id = case.get('id')
            if case_id and case_id in existing_ids:
                print(f"    跳过已存在的测试用例: ID={case_id}")
                total_skipped += 1
                continue
            
            # 准备API数据
            api_data = {
                'module_id': module_id,
                'title': case.get('title', f'测试用例 {i+1}'),
                'description': case.get('description', ''),
                'steps': case.get('steps', ''),
                'expected_result': case.get('expected', ''),
                'actual_result': case.get('actualResult', ''),
                'status': case.get('status', 'pending'),
                'priority': case.get('priority', 'medium'),
                'estimated_time': case.get('estimatedTime', 30),
                'executed_by': case.get('executedBy', 'system'),
                'notes': case.get('notes', '')
            }
            
            # 创建测试用例
            result = create_test_case_via_api(api_data)
            if result:
                print(f"    ✓ 创建成功: {api_data['title']}")
                total_added += 1
            else:
                print(f"    ✗ 创建失败: {api_data['title']}")
    
    print(f"\n3. 同步完成:")
    print(f"  新增测试用例: {total_added}")
    print(f"  跳过已存在: {total_skipped}")
    print(f"  总计处理: {total_added + total_skipped}")

if __name__ == "__main__":
    sync_js_to_database()