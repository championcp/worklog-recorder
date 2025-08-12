#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import json
from datetime import datetime

def add_task_module_to_database():
    """直接通过数据库添加任务管理模块"""
    print("============================================================")
    print("直接通过数据库添加任务管理模块")
    print("============================================================")
    
    try:
        # 连接数据库
        conn = sqlite3.connect('test_management.db')
        cursor = conn.cursor()
        
        # 检查是否已存在任务管理模块
        cursor.execute("SELECT id, name FROM test_modules WHERE name = ?", ('任务管理',))
        existing = cursor.fetchone()
        
        if existing:
            print(f"✓ 任务管理模块已存在，ID: {existing[0]}")
            return existing[0]
        
        # 插入任务管理模块
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            INSERT INTO test_modules (name, description, color, icon, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ('任务管理', '工作任务的创建、编辑、删除和管理功能', '#28a745', '📋', now, now))
        
        module_id = cursor.lastrowid
        conn.commit()
        
        print(f"✓ 任务管理模块创建成功，ID: {module_id}")
        
        # 验证创建结果
        cursor.execute("SELECT * FROM test_modules WHERE id = ?", (module_id,))
        module = cursor.fetchone()
        print(f"  模块信息: {module}")
        
        conn.close()
        return module_id
        
    except Exception as e:
        print(f"✗ 操作失败: {e}")
        return None

if __name__ == '__main__':
    add_task_module_to_database()