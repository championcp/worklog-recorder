#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完全重置并导入测试用例数据的脚本
"""

import sqlite3
import os
import re
import time
from datetime import datetime

def completely_reset_database():
    """完全重置数据库"""
    conn = sqlite3.connect('test_management.db', timeout=30.0)
    cursor = conn.cursor()
    
    print("🗑️ 完全清空数据库...")
    
    # 删除所有测试相关数据
    cursor.execute("DELETE FROM test_steps")
    cursor.execute("DELETE FROM test_cases") 
    cursor.execute("DELETE FROM test_results")
    cursor.execute("DELETE FROM test_modules")
    
    # 重置所有自增ID
    cursor.execute("DELETE FROM sqlite_sequence")
    
    # 验证清空结果
    cursor.execute("SELECT COUNT(*) FROM test_cases")
    case_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM test_steps")
    step_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM test_modules")
    module_count = cursor.fetchone()[0]
    
    print(f"   测试用例: {case_count}")
    print(f"   测试步骤: {step_count}")
    print(f"   测试模块: {module_count}")
    
    if case_count == 0 and step_count == 0 and module_count == 0:
        print("✅ 数据库完全清空成功")
    else:
        print("❌ 数据库清空失败")
        conn.close()
        return False
    
    conn.commit()
    conn.close()
    return True

def create_module(module_name):
    """创建测试模块"""
    conn = sqlite3.connect('test_management.db', timeout=30.0)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO test_modules (name, description, color, icon, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (module_name, f"{module_name}模块", "#3B82F6", "📋", now, now))
    
    module_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    print(f"✅ 创建模块: {module_name} (ID: {module_id})")
    return module_id

def parse_js_file(file_path):
    """解析JS文件中的测试用例"""
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取测试用例数组
        array_pattern = r'const\s+(\w+TestCases)\s*=\s*\[(.*?)\];'
        match = re.search(array_pattern, content, re.DOTALL)
        
        if not match:
            return []
        
        # 提取每个测试用例对象
        case_pattern = r'\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
        cases = re.findall(case_pattern, match.group(2))
        
        test_cases = []
        for i, case_str in enumerate(cases):
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
                step_matches = re.findall(r'[\'"]([^\'"]*)[\'"]', steps_match.group(1))
                steps = step_matches
            
            # 状态值映射
            status_mapping = {
                'completed': 'passed',
                'published': 'passed', 
                'active': 'pending',
                'inactive': 'skipped'
            }
            
            original_status = status_match.group(1) if status_match else 'pending'
            mapped_status = status_mapping.get(original_status, original_status)
            
            valid_statuses = ['pending', 'passed', 'failed', 'blocked', 'skipped']
            if mapped_status not in valid_statuses:
                mapped_status = 'pending'
            
            test_case = {
                'name': name_match.group(1) if name_match else f'测试用例{i+1}',
                'description': desc_match.group(1) if desc_match else '',
                'priority': priority_match.group(1) if priority_match else 'medium',
                'status': mapped_status,
                'expected_result': expected_match.group(1) if expected_match else '',
                'steps': steps
            }
            
            test_cases.append(test_case)
        
        return test_cases
        
    except Exception as e:
        print(f"❌ 解析文件失败 {file_path}: {str(e)}")
        return []

def import_test_cases(test_cases, module_id):
    """批量导入测试用例"""
    if not test_cases:
        return 0
    
    conn = sqlite3.connect('test_management.db', timeout=30.0)
    cursor = conn.cursor()
    
    imported_count = 0
    now = datetime.now().isoformat()
    
    for i, test_case in enumerate(test_cases):
        try:
            # 插入测试用例
            cursor.execute("""
                INSERT INTO test_cases (
                    title, description, module_id, priority, status, 
                    expected_result, estimated_time, actual_result, executed_by,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                test_case['name'],
                test_case['description'], 
                module_id,
                test_case['priority'],
                test_case['status'],
                test_case['expected_result'],
                '', '', '', now, now
            ))
            
            test_case_id = cursor.lastrowid
            
            # 插入测试步骤
            for step_order, step_description in enumerate(test_case['steps'], 1):
                cursor.execute("""
                    INSERT INTO test_steps (
                        test_case_id, step_order, description, expected_result,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (test_case_id, step_order, step_description, '', now, now))
            
            imported_count += 1
            print(f"  ✅ 导入: {test_case['name']} (ID: {test_case_id})")
            
        except Exception as e:
            print(f"  ❌ 导入失败: {test_case['name']} - {str(e)}")
            continue
    
    conn.commit()
    conn.close()
    return imported_count

def main():
    print("============================================================")
    print("🚀 完全重置并导入测试用例数据")
    print("============================================================")
    
    # 1. 完全重置数据库
    if not completely_reset_database():
        print("❌ 数据库重置失败，退出")
        return False
    
    # 2. 获取JS文件列表
    testcases_dir = 'testCases'
    if not os.path.exists(testcases_dir):
        print(f"❌ 目录不存在: {testcases_dir}")
        return False
    
    js_files = [f for f in os.listdir(testcases_dir) if f.endswith('.js')]
    print(f"📁 找到 {len(js_files)} 个JS文件: {js_files}")
    
    # 3. 模块名映射
    module_mapping = {
        'task.js': '任务管理',
        'auth.js': '用户认证', 
        'log.js': '工作日志',
        'report.js': '报告管理',
        'time.js': '时间记录',
        'tag.js': '标签管理',
        'statistics.js': '统计分析',
        'plan.js': '计划管理',
        'settings.js': '设置',
        'category.js': '分类管理',
        'dashboard.js': '仪表板',
        'index.js': '首页'
    }
    
    total_imported = 0
    
    # 4. 处理每个文件
    for js_file in sorted(js_files):  # 排序确保一致性
        file_path = os.path.join(testcases_dir, js_file)
        module_name = module_mapping.get(js_file, js_file.replace('.js', ''))
        
        print(f"\n📄 处理文件: {js_file} -> {module_name}")
        
        # 解析测试用例
        test_cases = parse_js_file(file_path)
        if not test_cases:
            print(f"  ⚠️ 未找到测试用例")
            continue
        
        print(f"  📋 解析出 {len(test_cases)} 个测试用例")
        
        # 创建模块
        module_id = create_module(module_name)
        
        # 导入测试用例
        imported_count = import_test_cases(test_cases, module_id)
        total_imported += imported_count
        
        print(f"  ✅ 成功导入 {imported_count} 个测试用例")
    
    print(f"\n============================================================")
    print(f"🎉 导入完成!")
    print(f"📊 总计导入: {total_imported} 个测试用例")
    
    # 5. 验证结果
    conn = sqlite3.connect('test_management.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM test_cases")
    final_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM test_modules")
    module_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM test_steps")
    step_count = cursor.fetchone()[0]
    
    print(f"📈 验证结果:")
    print(f"   测试模块: {module_count}")
    print(f"   测试用例: {final_count}")
    print(f"   测试步骤: {step_count}")
    
    # 检查重复数据
    cursor.execute("SELECT title, COUNT(*) FROM test_cases GROUP BY title HAVING COUNT(*) > 1")
    duplicates = cursor.fetchall()
    
    if duplicates:
        print(f"⚠️ 发现 {len(duplicates)} 个重复标题:")
        for title, count in duplicates[:5]:
            print(f"   {title}: {count}次")
    else:
        print("✅ 无重复数据")
    
    conn.close()
    print(f"============================================================")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)