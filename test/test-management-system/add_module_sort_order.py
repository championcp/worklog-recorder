#!/usr/bin/env python3
"""
为测试模块表添加排序字段并设置排序顺序
"""

import sqlite3
import os
from database import TestDatabase

def add_sort_order_field():
    """为模块表添加排序字段"""
    db_path = "test_management.db"
    
    # 检查数据库文件是否存在
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件 {db_path} 不存在")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # 检查是否已经有 sort_order 字段
        cursor = conn.execute("PRAGMA table_info(test_modules)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'sort_order' not in columns:
            print("📝 添加 sort_order 字段到 test_modules 表...")
            conn.execute('''
                ALTER TABLE test_modules 
                ADD COLUMN sort_order INTEGER DEFAULT 999
            ''')
            print("✅ sort_order 字段添加成功")
        else:
            print("ℹ️ sort_order 字段已存在")
        
        # 设置模块的排序顺序
        module_order = [
            '用户认证',      # 1
            '仪表板',        # 2
            '任务管理',      # 3
            '分类管理',      # 4
            '标签管理',      # 5
            '计划管理',      # 6
            '时间记录',      # 7
            '工作日志',      # 8
            '统计分析',      # 9
            '报告管理',      # 10
            '设置',          # 11
            '模板管理'       # 12
        ]
        
        print("📊 设置模块排序顺序...")
        
        # 获取现有模块
        cursor = conn.execute("SELECT id, name FROM test_modules")
        existing_modules = {row['name']: row['id'] for row in cursor.fetchall()}
        
        # 更新排序顺序
        updated_count = 0
        for index, module_name in enumerate(module_order, 1):
            if module_name in existing_modules:
                module_id = existing_modules[module_name]
                conn.execute('''
                    UPDATE test_modules 
                    SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (index, module_id))
                print(f"  {index:2d}. {module_name}")
                updated_count += 1
        
        # 为不在排序列表中的模块设置默认排序
        cursor = conn.execute('''
            SELECT id, name FROM test_modules 
            WHERE name NOT IN ({})
        '''.format(','.join('?' * len(module_order))), module_order)
        
        other_modules = cursor.fetchall()
        for i, row in enumerate(other_modules):
            sort_order = len(module_order) + i + 1
            conn.execute('''
                UPDATE test_modules 
                SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (sort_order, row['id']))
            print(f"  {sort_order:2d}. {row['name']} (其他模块)")
        
        conn.commit()
        conn.close()
        
        print(f"✅ 成功更新了 {updated_count} 个模块的排序顺序")
        return True
        
    except Exception as e:
        print(f"❌ 更新失败: {str(e)}")
        return False

def verify_sort_order():
    """验证排序顺序是否正确"""
    try:
        db = TestDatabase()
        
        with db.get_connection() as conn:
            cursor = conn.execute('''
                SELECT name, sort_order 
                FROM test_modules 
                ORDER BY sort_order, name
            ''')
            modules = cursor.fetchall()
        
        print("\n📋 当前模块排序顺序:")
        print("-" * 30)
        for module in modules:
            print(f"{module['sort_order']:2d}. {module['name']}")
        
        return True
        
    except Exception as e:
        print(f"❌ 验证失败: {str(e)}")
        return False

if __name__ == '__main__':
    print("🚀 开始添加模块排序字段...")
    
    if add_sort_order_field():
        print("\n🔍 验证排序结果...")
        verify_sort_order()
        print("\n🎉 模块排序字段添加完成!")
    else:
        print("\n❌ 操作失败")