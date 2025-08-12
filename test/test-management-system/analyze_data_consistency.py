#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据一致性分析脚本
比较数据库中的测试用例数据与JS文件中的数据
"""

import json
import requests
import os
import re
from collections import defaultdict

# 导入配置管理器
try:
    from config import get_api_url
except ImportError:
    # 如果配置模块不可用，使用默认配置
    def get_api_url(endpoint):
        return f'http://localhost:8000/api{endpoint}'

def get_database_test_cases():
    """从API获取数据库中的测试用例"""
    try:
        api_url = get_api_url('/test-cases')
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            return data.get('data', [])
        else:
            print(f"API请求失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取数据库数据失败: {e}")
        return []

def parse_js_file(file_path):
    """解析JS文件中的测试用例数据"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 查找testCases数组 - 支持多种命名方式
        patterns = [
            r'const\s+\w*[Tt]est[Cc]ases\s*=\s*(\[.*?\]);',
            r'const\s+testCases\s*=\s*(\[.*?\]);',
            r'let\s+\w*[Tt]est[Cc]ases\s*=\s*(\[.*?\]);'
        ]
        
        test_cases_str = None
        for pattern in patterns:
            test_cases_match = re.search(pattern, content, re.DOTALL)
            if test_cases_match:
                test_cases_str = test_cases_match.group(1)
                break
        
        if not test_cases_str:
            return []
        
        # 计算测试用例数量 - 通过计算对象的数量
        # 查找 { 开始的对象，确保它们是数组中的元素
        object_count = 0
        brace_level = 0
        in_string = False
        escape_next = False
        
        for i, char in enumerate(test_cases_str):
            if escape_next:
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                continue
                
            if char in ['"', "'"]:
                if not in_string:
                    in_string = char
                elif in_string == char:
                    in_string = False
                continue
                
            if in_string:
                continue
                
            if char == '{':
                if brace_level == 0:  # 这是一个新的顶级对象
                    object_count += 1
                brace_level += 1
            elif char == '}':
                brace_level -= 1
        
        # 如果简单计数失败，尝试正则表达式方法
        if object_count == 0:
            # 查找id字段来计算测试用例数量
            id_matches = re.findall(r'id:\s*["\']([^"\']*)["\']', test_cases_str)
            object_count = len(id_matches)
        
        return [{'count': object_count, 'file': file_path}]
        
    except Exception as e:
        print(f"解析JS文件失败 {file_path}: {e}")
        return []

def get_js_test_cases():
    """获取所有JS文件中的测试用例"""
    js_dir = '/Users/chengpeng/traeWorkspace/nobody-logger/test/test-management-system/testCases'
    total_count = 0
    file_counts = {}
    
    # 获取所有JS文件（除了index.js）
    js_files = [f for f in os.listdir(js_dir) if f.endswith('.js') and f != 'index.js']
    
    for js_file in js_files:
        file_path = os.path.join(js_dir, js_file)
        result = parse_js_file(file_path)
        count = result[0]['count'] if result else 0
        file_counts[js_file] = count
        total_count += count
        print(f"{js_file}: {count} 个测试用例")
    
    return total_count, file_counts

def analyze_data_consistency():
    """分析数据一致性"""
    print("=" * 60)
    print("数据一致性分析报告")
    print("=" * 60)
    
    # 获取数据库数据
    print("\n1. 获取数据库数据...")
    db_test_cases = get_database_test_cases()
    print(f"数据库中测试用例总数: {len(db_test_cases)}")
    
    # 按模块统计数据库数据
    db_by_module = defaultdict(int)
    for case in db_test_cases:
        module_name = case.get('module_name', 'unknown')
        db_by_module[module_name] += 1
    
    print("\n数据库中各模块测试用例数量:")
    for module, count in sorted(db_by_module.items()):
        print(f"  {module}: {count}")
    
    # 获取JS文件数据
    print("\n2. 获取JS文件数据...")
    js_total_count, js_file_counts = get_js_test_cases()
    print(f"JS文件中测试用例总数: {js_total_count}")
    
    print("\nJS文件中各文件测试用例数量:")
    for file_name, count in sorted(js_file_counts.items()):
        print(f"  {file_name}: {count}")
    
    # 数据对比
    print("\n3. 数据对比分析:")
    print(f"数据库总数: {len(db_test_cases)}")
    print(f"JS文件总数: {js_total_count}")
    print(f"差异: {js_total_count - len(db_test_cases)}")
    
    # 建议
    print("\n4. 建议:")
    if js_total_count > len(db_test_cases):
        print("  - JS文件中有更多测试用例，建议将缺失的测试用例导入数据库")
        print("  - 或者考虑删除JS文件中的冗余数据，以数据库为准")
    elif js_total_count < len(db_test_cases):
        print("  - 数据库中有更多测试用例，建议更新JS文件")
    else:
        print("  - 测试用例总数一致，但需要检查具体内容是否匹配")
    
    # 详细的文件映射分析
    print("\n5. 详细文件映射分析:")
    
    # 模块名映射
    module_mapping = {
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
    
    for js_file, js_count in sorted(js_file_counts.items()):
        module_name = module_mapping.get(js_file, 'unknown')
        db_count = db_by_module.get(module_name, 0)
        diff = js_count - db_count
        status = "✓" if diff == 0 else "✗"
        print(f"  {status} {js_file} -> {module_name}: JS={js_count}, DB={db_count}, 差异={diff}")
    
    return {
        'db_total': len(db_test_cases),
        'js_total': js_total_count,
        'db_by_module': dict(db_by_module),
        'js_file_counts': js_file_counts
    }

if __name__ == "__main__":
    analyze_data_consistency()