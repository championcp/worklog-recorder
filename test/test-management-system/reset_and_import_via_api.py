#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通过API清空数据库并重新导入JS测试用例数据
"""

import os
import re
import json
import requests
from typing import List, Dict, Any, Optional

# API配置
API_BASE_URL = "http://localhost:8000"

def get_all_test_cases() -> List[Dict[str, Any]]:
    """获取所有测试用例"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/test-cases", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and 'data' in data:
                return data['data']
            elif isinstance(data, list):
                return data
            else:
                return []
        else:
            print(f"获取测试用例失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"API请求失败: {e}")
        return []

def delete_test_case(test_case_id: int) -> bool:
    """删除指定的测试用例"""
    try:
        response = requests.delete(f"{API_BASE_URL}/api/test-cases/{test_case_id}", timeout=10)
        return response.status_code in [200, 204]
    except Exception as e:
        print(f"删除测试用例失败: {e}")
        return False

def clear_all_test_cases():
    """清空所有测试用例"""
    print("获取所有测试用例...")
    test_cases = get_all_test_cases()
    
    if not test_cases:
        print("没有找到测试用例")
        return True
    
    print(f"找到 {len(test_cases)} 个测试用例，开始删除...")
    
    deleted_count = 0
    failed_count = 0
    
    for i, test_case in enumerate(test_cases, 1):
        test_id = test_case.get('id')
        title = test_case.get('title', 'Unknown')
        
        print(f"删除 {i}/{len(test_cases)}: {title} (ID: {test_id})")
        
        if delete_test_case(test_id):
            print(f"  ✓ 删除成功")
            deleted_count += 1
        else:
            print(f"  ✗ 删除失败")
            failed_count += 1
    
    print(f"\n删除完成:")
    print(f"  成功删除: {deleted_count}")
    print(f"  删除失败: {failed_count}")
    print(f"  总计处理: {len(test_cases)}")
    
    return failed_count == 0

def get_module_id_by_name(module_name: str) -> Optional[int]:
    """根据模块名获取模块ID"""
    module_mapping = {
        "用户认证": 1, "仪表板": 2, "任务管理": 3, "分类管理": 4,
        "标签管理": 5, "计划管理": 6, "时间记录": 7, "工作日志": 8,
        "统计分析": 9, "报告管理": 10, "设置": 11
    }
    return module_mapping.get(module_name)

def parse_single_test_case(case_text: str) -> Optional[Dict[str, Any]]:
    """解析单个测试用例对象"""
    try:
        # 提取各个字段
        fields = {}
        
        # ID
        id_match = re.search(r'id:\s*(\d+)', case_text)
        if id_match:
            fields['id'] = int(id_match.group(1))
        
        # Category
        category_match = re.search(r'category:\s*["\']([^"\']+)["\']', case_text)
        if category_match:
            fields['category'] = category_match.group(1)
        
        # Title
        title_match = re.search(r'title:\s*["\']([^"\']+)["\']', case_text)
        if title_match:
            fields['title'] = title_match.group(1)
        
        # Description
        desc_match = re.search(r'description:\s*["\']([^"\']+)["\']', case_text)
        if desc_match:
            fields['description'] = desc_match.group(1)
        
        # Steps (数组格式)
        steps_match = re.search(r'steps:\s*\[(.*?)\]', case_text, re.DOTALL)
        if steps_match:
            steps_content = steps_match.group(1)
            steps = re.findall(r'["\']([^"\']+)["\']', steps_content)
            fields['steps'] = steps
        
        # Expected
        expected_match = re.search(r'expected:\s*["\']([^"\']+)["\']', case_text)
        if expected_match:
            fields['expected'] = expected_match.group(1)
        
        # Status
        status_match = re.search(r'status:\s*["\']([^"\']+)["\']', case_text)
        if status_match:
            fields['status'] = status_match.group(1)
        
        # Priority
        priority_match = re.search(r'priority:\s*["\']([^"\']+)["\']', case_text)
        if priority_match:
            fields['priority'] = priority_match.group(1)
        
        # EstimatedTime
        time_match = re.search(r'estimatedTime:\s*["\']([^"\']+)["\']', case_text)
        if time_match:
            fields['estimatedTime'] = time_match.group(1)
        
        return fields if fields else None
        
    except Exception as e:
        print(f"解析测试用例失败: {e}")
        return None

def extract_test_cases_from_js(file_path: str) -> List[Dict[str, Any]]:
    """从JS文件中提取测试用例"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找测试用例数组
        array_pattern = r'(?:const|let|var)\s+\w*[Tt]est[Cc]ases?\s*=\s*\[(.*?)\];'
        match = re.search(array_pattern, content, re.DOTALL)
        
        if not match:
            return []
        
        array_content = match.group(1)
        
        # 分割单个测试用例对象
        cases = []
        brace_count = 0
        current_case = ""
        
        for char in array_content:
            if char == '{':
                if brace_count == 0:
                    current_case = "{"
                else:
                    current_case += char
                brace_count += 1
            elif char == '}':
                current_case += char
                brace_count -= 1
                if brace_count == 0:
                    # 解析这个测试用例
                    parsed_case = parse_single_test_case(current_case)
                    if parsed_case:
                        cases.append(parsed_case)
                    current_case = ""
            elif brace_count > 0:
                current_case += char
        
        return cases
        
    except Exception as e:
        print(f"读取JS文件失败 {file_path}: {e}")
        return []

def create_test_case_via_api(test_case_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
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

def import_js_test_cases():
    """导入JS文件中的测试用例"""
    print("开始导入JS测试用例...")
    
    # 获取JS文件中的测试用例
    js_dir = "testCases"
    js_files = [f for f in os.listdir(js_dir) if f.endswith('.js')]
    
    file_module_mapping = {
        "auth.js": "用户认证", "dashboard.js": "仪表板", "task.js": "任务管理",
        "category.js": "分类管理", "tag.js": "标签管理", "plan.js": "计划管理",
        "time.js": "时间记录", "log.js": "工作日志", "statistics.js": "统计分析",
        "report.js": "报告管理", "settings.js": "设置"
    }
    
    all_js_cases = []
    for js_file in js_files:
        if js_file in file_module_mapping:
            file_path = os.path.join(js_dir, js_file)
            cases = extract_test_cases_from_js(file_path)
            module_name = file_module_mapping[js_file]
            
            for case in cases:
                case['module_name'] = module_name
                case['module_id'] = get_module_id_by_name(module_name)
            
            all_js_cases.extend(cases)
            print(f"  {js_file}: {len(cases)} 个测试用例")
    
    print(f"JS文件中总计: {len(all_js_cases)} 个测试用例")
    
    # 导入测试用例
    print("\n开始导入...")
    created_count = 0
    failed_count = 0
    
    for i, js_case in enumerate(all_js_cases, 1):
        print(f"导入 {i}/{len(all_js_cases)}: {js_case.get('title', 'Unknown')}")
        
        # 转换数据格式
        api_data = {
            "module_id": js_case.get('module_id'),
            "title": js_case.get('title', ''),
            "description": js_case.get('description', ''),
            "steps": '\n'.join(js_case.get('steps', [])),
            "expected_result": js_case.get('expected', ''),
            "priority": js_case.get('priority', 'medium'),
            "estimated_time": js_case.get('estimatedTime', ''),
            "status": js_case.get('status', 'pending')
        }
        
        # 创建测试用例
        result = create_test_case_via_api(api_data)
        if result:
            print(f"  ✓ 导入成功")
            created_count += 1
        else:
            print(f"  ✗ 导入失败")
            failed_count += 1
    
    # 输出结果
    print(f"\n导入完成:")
    print(f"  成功导入: {created_count}")
    print(f"  导入失败: {failed_count}")
    print(f"  总计处理: {len(all_js_cases)}")

def main():
    """主函数"""
    print("=" * 60)
    print("通过API清空数据库并重新导入测试用例数据")
    print("=" * 60)
    
    # 1. 清空所有测试用例
    print("\n1. 清空所有测试用例...")
    if not clear_all_test_cases():
        print("清空测试用例失败，但继续导入新数据")
    
    # 2. 重新导入数据
    print("\n2. 重新导入数据...")
    import_js_test_cases()
    
    print("\n" + "=" * 60)
    print("操作完成！")

if __name__ == "__main__":
    main()