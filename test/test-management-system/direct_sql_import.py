#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接解析JS文件并通过SQL导入数据库的脚本
"""

import sqlite3
import os
import re
import json
import time
from datetime import datetime

def get_db_connection(max_retries=5):
    """获取数据库连接，带重试机制"""
    for attempt in range(max_retries):
        try:
            conn = sqlite3.connect('test_management.db', timeout=30.0)
            conn.execute('PRAGMA journal_mode=WAL;')  # 使用WAL模式避免锁定
            return conn
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                print(f"⚠️ 数据库被锁定，等待 {attempt + 1} 秒后重试...")
                time.sleep(attempt + 1)
                continue
            else:
                raise e
    raise Exception("无法连接到数据库")

def init_database():
    """初始化数据库，清空现有数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🗑️ 清空现有测试用例数据...")
    cursor.execute("DELETE FROM test_steps")
    cursor.execute("DELETE FROM test_cases") 
    cursor.execute("DELETE FROM test_results")
    
    # 重置自增ID
    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('test_cases', 'test_steps', 'test_results')")
    
    conn.commit()
    conn.close()
    print("✅ 数据库初始化完成")

def get_module_id(module_name):
    """获取模块ID，如果不存在则创建"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM test_modules WHERE name = ?", (module_name,))
    result = cursor.fetchone()
    
    if result:
        module_id = result[0]
    else:
        # 创建新模块
        cursor.execute("""
            INSERT INTO test_modules (name, description, color, icon, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (module_name, f"{module_name}模块", "#3B82F6", "📋", datetime.now(), datetime.now()))
        module_id = cursor.lastrowid
        print(f"✅ 创建新模块: {module_name} (ID: {module_id})")
    
    conn.commit()
    conn.close()
    return module_id

def parse_js_file(file_path):
    """解析单个JS文件中的测试用例"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取测试用例数组的变量名
        array_pattern = r'const\s+(\w+TestCases)\s*=\s*\[(.*?)\];'
        match = re.search(array_pattern, content, re.DOTALL)
        
        if not match:
            print(f"❌ 未找到测试用例数组: {file_path}")
            return []
        
        array_name = match.group(1)
        test_cases_str = match.group(1) + ' = [' + match.group(2) + '];'
        
        # 使用正则表达式提取每个测试用例对象
        case_pattern = r'\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
        cases = re.findall(case_pattern, match.group(2))
        
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
                
                # 状态值映射
                status_mapping = {
                    'completed': 'passed',
                    'published': 'passed', 
                    'active': 'pending',
                    'inactive': 'skipped'
                }
                
                original_status = status_match.group(1) if status_match else 'pending'
                mapped_status = status_mapping.get(original_status, original_status)
                
                # 确保状态值有效
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
                
            except Exception as e:
                print(f"⚠️ 解析测试用例 {i+1} 时出错: {str(e)}")
                continue
        
        print(f"✅ 从 {file_path} 解析出 {len(test_cases)} 个测试用例")
        return test_cases
        
    except Exception as e:
        print(f"❌ 读取文件失败 {file_path}: {str(e)}")
        return []

def insert_test_case(cursor, test_case, module_id):
    """插入单个测试用例到数据库"""
    now = datetime.now().isoformat()
    
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
        '',  # estimated_time
        '',  # actual_result
        '',  # executed_by
        now,
        now
    ))
    
    test_case_id = cursor.lastrowid
    
    # 插入测试步骤
    for step_order, step_description in enumerate(test_case['steps'], 1):
        cursor.execute("""
            INSERT INTO test_steps (
                test_case_id, step_order, description, expected_result,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            test_case_id,
            step_order,
            step_description,
            '',  # expected_result for step
            now,
            now
        ))
    
    return test_case_id

def main():
    print("============================================================")
    print("🚀 直接SQL导入测试用例脚本")
    print("============================================================")
    
    # 1. 初始化数据库
    init_database()
    
    # 2. 获取testCases目录下的所有JS文件
    testcases_dir = 'testCases'
    if not os.path.exists(testcases_dir):
        print(f"❌ 目录不存在: {testcases_dir}")
        return False
    
    js_files = [f for f in os.listdir(testcases_dir) if f.endswith('.js')]
    print(f"📁 找到 {len(js_files)} 个JS文件: {js_files}")
    
    # 3. 连接数据库
    conn = get_db_connection()
    cursor = conn.cursor()
    
    total_imported = 0
    
    try:
        # 4. 处理每个JS文件
        for js_file in js_files:
            file_path = os.path.join(testcases_dir, js_file)
            print(f"\n📄 处理文件: {js_file}")
            
            # 根据文件名确定模块名
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
            
            module_name = module_mapping.get(js_file, js_file.replace('.js', ''))
            module_id = get_module_id(module_name)
            
            # 解析测试用例
            test_cases = parse_js_file(file_path)
            
            # 导入测试用例
            for i, test_case in enumerate(test_cases, 1):
                try:
                    test_case_id = insert_test_case(cursor, test_case, module_id)
                    print(f"  ✅ 导入测试用例 {i}: {test_case['name']} (ID: {test_case_id})")
                    total_imported += 1
                except Exception as e:
                    print(f"  ❌ 导入失败 {i}: {test_case['name']} - {str(e)}")
        
        # 5. 提交事务
        conn.commit()
        
        print(f"\n============================================================")
        print(f"🎉 导入完成!")
        print(f"📊 总计导入: {total_imported} 个测试用例")
        print(f"============================================================")
        
        return True
        
    except Exception as e:
        print(f"❌ 导入过程中出错: {str(e)}")
        conn.rollback()
        return False
        
    finally:
        conn.close()

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)