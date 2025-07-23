#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版SQL导入脚本 - 每个文件单独处理
"""

import sqlite3
import os
import re
import time
from datetime import datetime

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect('test_management.db', timeout=30.0)
    conn.execute('PRAGMA journal_mode=WAL;')
    return conn

def init_database():
    """初始化数据库，清空现有数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🗑️ 清空现有测试用例数据...")
    cursor.execute("DELETE FROM test_steps")
    cursor.execute("DELETE FROM test_cases") 
    cursor.execute("DELETE FROM test_results")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('test_cases', 'test_steps', 'test_results')")
    
    conn.commit()
    conn.close()
    print("✅ 数据库初始化完成")

def get_or_create_module(module_name):
    """获取或创建模块"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM test_modules WHERE name = ?", (module_name,))
    result = cursor.fetchone()
    
    if result:
        module_id = result[0]
    else:
        cursor.execute("""
            INSERT INTO test_modules (name, description, color, icon, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (module_name, f"{module_name}模块", "#3B82F6", "📋", datetime.now().isoformat(), datetime.now().isoformat()))
        module_id = cursor.lastrowid
        print(f"✅ 创建新模块: {module_name} (ID: {module_id})")
    
    conn.commit()
    conn.close()
    return module_id

def parse_and_import_file(file_path, module_name):
    """解析并导入单个JS文件"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取测试用例数组
        array_pattern = r'const\s+(\w+TestCases)\s*=\s*\[(.*?)\];'
        match = re.search(array_pattern, content, re.DOTALL)
        
        if not match:
            print(f"❌ 未找到测试用例数组: {file_path}")
            return 0
        
        # 提取每个测试用例对象
        case_pattern = r'\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
        cases = re.findall(case_pattern, match.group(2))
        
        if not cases:
            print(f"❌ 未找到测试用例: {file_path}")
            return 0
        
        # 获取模块ID
        module_id = get_or_create_module(module_name)
        
        # 连接数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        
        imported_count = 0
        
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
                
                # 插入测试用例
                now = datetime.now().isoformat()
                cursor.execute("""
                    INSERT INTO test_cases (
                        title, description, module_id, priority, status, 
                        expected_result, estimated_time, actual_result, executed_by,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    name_match.group(1) if name_match else f'测试用例{i+1}',
                    desc_match.group(1) if desc_match else '',
                    module_id,
                    priority_match.group(1) if priority_match else 'medium',
                    mapped_status,
                    expected_match.group(1) if expected_match else '',
                    '', '', '', now, now
                ))
                
                test_case_id = cursor.lastrowid
                
                # 插入测试步骤
                for step_order, step_description in enumerate(steps, 1):
                    cursor.execute("""
                        INSERT INTO test_steps (
                            test_case_id, step_order, description, expected_result,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (test_case_id, step_order, step_description, '', now, now))
                
                imported_count += 1
                print(f"  ✅ 导入测试用例 {i+1}: {name_match.group(1) if name_match else f'测试用例{i+1}'} (ID: {test_case_id})")
                
            except Exception as e:
                print(f"  ❌ 导入失败 {i+1}: {str(e)}")
                continue
        
        conn.commit()
        conn.close()
        
        print(f"✅ 从 {file_path} 导入了 {imported_count} 个测试用例")
        return imported_count
        
    except Exception as e:
        print(f"❌ 处理文件失败 {file_path}: {str(e)}")
        return 0

def main():
    print("============================================================")
    print("🚀 简化版SQL导入测试用例脚本")
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
    
    # 4. 逐个处理文件
    for js_file in js_files:
        file_path = os.path.join(testcases_dir, js_file)
        module_name = module_mapping.get(js_file, js_file.replace('.js', ''))
        
        print(f"\n📄 处理文件: {js_file} -> {module_name}")
        
        try:
            count = parse_and_import_file(file_path, module_name)
            total_imported += count
            
            # 每个文件处理完后稍微等待一下
            time.sleep(0.1)
            
        except Exception as e:
            print(f"❌ 处理文件 {js_file} 时出错: {str(e)}")
            continue
    
    print(f"\n============================================================")
    print(f"🎉 导入完成!")
    print(f"📊 总计导入: {total_imported} 个测试用例")
    print(f"============================================================")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)