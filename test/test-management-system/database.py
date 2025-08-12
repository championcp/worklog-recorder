#!/usr/bin/env python3
"""
测试用例管理系统数据库模块
使用SQLite数据库存储测试模块、测试用例、测试步骤和测试结果
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any

class TestDatabase:
    def __init__(self, db_path: str = "test_management.db"):
        """
        初始化数据库连接
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
        return conn
    
    def init_database(self):
        """初始化数据库表结构"""
        with self.get_connection() as conn:
            # 创建测试模块表
            conn.execute('''
                CREATE TABLE IF NOT EXISTS test_modules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    color TEXT DEFAULT '#3498db',
                    icon TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建测试用例表
            conn.execute('''
                CREATE TABLE IF NOT EXISTS test_cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    module_id INTEGER NOT NULL,
                    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'blocked', 'skipped')),
                    estimated_time TEXT,
                    expected_result TEXT,
                    actual_result TEXT,
                    executed_by TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (module_id) REFERENCES test_modules (id) ON DELETE CASCADE
                )
            ''')
            
            # 创建测试步骤表
            conn.execute('''
                CREATE TABLE IF NOT EXISTS test_steps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_case_id INTEGER NOT NULL,
                    step_number INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    expected_result TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE CASCADE
                )
            ''')
            
            # 创建测试结果表
            conn.execute('''
                CREATE TABLE IF NOT EXISTS test_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_case_id INTEGER NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'blocked', 'skipped')),
                    actual_result TEXT,
                    notes TEXT,
                    executed_by TEXT,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE CASCADE
                )
            ''')
            
            # 创建索引
            conn.execute('CREATE INDEX IF NOT EXISTS idx_test_cases_module_id ON test_cases(module_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_test_steps_test_case_id ON test_steps(test_case_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id)')
            
            conn.commit()
            
        # 初始化默认数据
        self.init_default_data()
    
    def init_default_data(self):
        """初始化默认的测试模块和测试用例数据"""
        # 暂时禁用所有默认数据创建
        return
        
        # 默认测试模块
        default_modules = [
            {'name': '用户认证', 'description': '登录、注册、权限验证', 'color': '#3498db', 'icon': '🔐'},
            {'name': '仪表板', 'description': '数据展示、统计图表', 'color': '#2ecc71', 'icon': '📊'},
            {'name': '任务管理', 'description': '创建、编辑、状态管理', 'color': '#e74c3c', 'icon': '✅'},
            {'name': '分类管理', 'description': '分类创建、排序、权限', 'color': '#f39c12', 'icon': '📁'},
            {'name': '标签管理', 'description': '标签创建、搜索、统计', 'color': '#9b59b6', 'icon': '🏷️'},
            {'name': '计划管理', 'description': '计划创建、进度跟踪', 'color': '#1abc9c', 'icon': '📅'},
            {'name': '时间记录', 'description': '计时、统计、报告', 'color': '#34495e', 'icon': '⏱️'},
            {'name': '工作日志', 'description': '日志创建、模板、搜索', 'color': '#e67e22', 'icon': '📝'},
            {'name': '统计分析', 'description': '数据分析、可视化', 'color': '#c0392b', 'icon': '📈'},
            {'name': '报告管理', 'description': '报告生成、导出、分享', 'color': '#a18cd1', 'icon': '📋'},
            {'name': '设置', 'description': '个人设置、系统配置', 'color': '#16a085', 'icon': '⚙️'}
        ]
        
        # 插入默认模块
        for module in default_modules:
            module_id = self.create_module(module)
            
            # 为每个模块创建一些默认测试用例
            default_test_cases = [
                {
                    'title': f'{module["name"]}基础功能测试',
                    'description': f'测试{module["name"]}的基本功能是否正常工作',
                    'module_id': module_id,
                    'priority': 'high',
                    'estimated_time': '15分钟',
                    'expected_result': f'{module["name"]}功能正常运行，无错误提示'
                },
                {
                    'title': f'{module["name"]}界面显示测试',
                    'description': f'测试{module["name"]}界面元素是否正确显示',
                    'module_id': module_id,
                    'priority': 'medium',
                    'estimated_time': '10分钟',
                    'expected_result': f'{module["name"]}界面显示正常，布局合理'
                },
                {
                    'title': f'{module["name"]}数据验证测试',
                    'description': f'测试{module["name"]}的数据验证功能',
                    'module_id': module_id,
                    'priority': 'high',
                    'estimated_time': '20分钟',
                    'expected_result': f'{module["name"]}数据验证正确，错误提示清晰'
                }
            ]
            
            for test_case in default_test_cases:
                test_case_id = self.create_test_case(test_case)
                
                # 为每个测试用例创建默认步骤
                default_steps = [
                    {'step_number': 1, 'description': f'打开{module["name"]}页面', 'expected_result': '页面正常加载'},
                    {'step_number': 2, 'description': '检查页面元素', 'expected_result': '所有元素正确显示'},
                    {'step_number': 3, 'description': '执行基本操作', 'expected_result': '操作成功完成'},
                    {'step_number': 4, 'description': '验证结果', 'expected_result': '结果符合预期'}
                ]
                
                for step in default_steps:
                    step['test_case_id'] = test_case_id
                    self.create_test_step(step)
    
    # 测试模块相关方法
    def create_module(self, module_data: Dict[str, Any]) -> int:
        """创建测试模块"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO test_modules (name, description, color, icon)
                VALUES (?, ?, ?, ?)
            ''', (
                module_data['name'],
                module_data.get('description', ''),
                module_data.get('color', '#3498db'),
                module_data.get('icon', '')
            ))
            return cursor.lastrowid
    
    def get_modules(self) -> List[Dict[str, Any]]:
        """获取所有测试模块"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                SELECT m.*, COUNT(tc.id) as test_case_count
                FROM test_modules m
                LEFT JOIN test_cases tc ON m.id = tc.module_id
                GROUP BY m.id
                ORDER BY m.sort_order ASC, m.name ASC
            ''')
            return [dict(row) for row in cursor.fetchall()]
    
    def get_module(self, module_id: int) -> Optional[Dict[str, Any]]:
        """获取单个测试模块"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                SELECT m.*, COUNT(tc.id) as test_case_count
                FROM test_modules m
                LEFT JOIN test_cases tc ON m.id = tc.module_id
                WHERE m.id = ?
                GROUP BY m.id
            ''', (module_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_module(self, module_id: int, module_data: Dict[str, Any]) -> bool:
        """更新测试模块"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                UPDATE test_modules 
                SET name = ?, description = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                module_data['name'],
                module_data.get('description', ''),
                module_data.get('color', '#3498db'),
                module_data.get('icon', ''),
                module_id
            ))
            return cursor.rowcount > 0
    
    def delete_module(self, module_id: int) -> bool:
        """删除测试模块"""
        with self.get_connection() as conn:
            cursor = conn.execute('DELETE FROM test_modules WHERE id = ?', (module_id,))
            return cursor.rowcount > 0
    
    # 测试用例相关方法
    def create_test_case(self, test_case_data: Dict[str, Any]) -> int:
        """创建测试用例"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO test_cases (
                    title, description, module_id, priority, status, 
                    estimated_time, expected_result, actual_result, executed_by
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                test_case_data['title'],
                test_case_data.get('description', ''),
                test_case_data['module_id'],
                test_case_data.get('priority', 'medium'),
                test_case_data.get('status', 'pending'),
                test_case_data.get('estimated_time', ''),
                test_case_data.get('expected_result', ''),
                test_case_data.get('actual_result', ''),
                test_case_data.get('executed_by', '')
            ))
            return cursor.lastrowid
    
    def get_test_cases(self, module_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """获取测试用例"""
        with self.get_connection() as conn:
            if module_id:
                cursor = conn.execute('''
                    SELECT tc.*, m.name as module_name
                    FROM test_cases tc
                    JOIN test_modules m ON tc.module_id = m.id
                    WHERE tc.module_id = ?
                    ORDER BY tc.created_at DESC
                ''', (module_id,))
            else:
                cursor = conn.execute('''
                    SELECT tc.*, m.name as module_name
                    FROM test_cases tc
                    JOIN test_modules m ON tc.module_id = m.id
                    ORDER BY tc.created_at DESC
                ''')
            return [dict(row) for row in cursor.fetchall()]
    
    def get_test_case(self, test_case_id: int) -> Optional[Dict[str, Any]]:
        """获取单个测试用例"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                SELECT tc.*, m.name as module_name
                FROM test_cases tc
                JOIN test_modules m ON tc.module_id = m.id
                WHERE tc.id = ?
            ''', (test_case_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_test_case(self, test_case_id: int, test_case_data: Dict[str, Any]) -> bool:
        """更新测试用例"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                UPDATE test_cases 
                SET title = ?, description = ?, module_id = ?, priority = ?, 
                    status = ?, estimated_time = ?, expected_result = ?, 
                    actual_result = ?, executed_by = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                test_case_data['title'],
                test_case_data.get('description', ''),
                test_case_data['module_id'],
                test_case_data.get('priority', 'medium'),
                test_case_data.get('status', 'pending'),
                test_case_data.get('estimated_time', ''),
                test_case_data.get('expected_result', ''),
                test_case_data.get('actual_result', ''),
                test_case_data.get('executed_by', ''),
                test_case_id
            ))
            return cursor.rowcount > 0
    
    def delete_test_case(self, test_case_id: int) -> bool:
        """删除测试用例"""
        with self.get_connection() as conn:
            cursor = conn.execute('DELETE FROM test_cases WHERE id = ?', (test_case_id,))
            return cursor.rowcount > 0
    
    # 测试步骤相关方法
    def create_test_step(self, step_data: Dict[str, Any]) -> int:
        """创建测试步骤"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO test_steps (test_case_id, step_number, description, expected_result)
                VALUES (?, ?, ?, ?)
            ''', (
                step_data['test_case_id'],
                step_data['step_number'],
                step_data['description'],
                step_data.get('expected_result', '')
            ))
            return cursor.lastrowid
    
    def get_test_steps(self, test_case_id: int) -> List[Dict[str, Any]]:
        """获取测试步骤"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                SELECT * FROM test_steps 
                WHERE test_case_id = ? 
                ORDER BY step_number
            ''', (test_case_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    def update_test_step(self, step_id: int, step_data: Dict[str, Any]) -> bool:
        """更新测试步骤"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                UPDATE test_steps 
                SET step_number = ?, description = ?, expected_result = ?
                WHERE id = ?
            ''', (
                step_data['step_number'],
                step_data['description'],
                step_data.get('expected_result', ''),
                step_id
            ))
            return cursor.rowcount > 0
    
    def delete_test_step(self, step_id: int) -> bool:
        """删除测试步骤"""
        with self.get_connection() as conn:
            cursor = conn.execute('DELETE FROM test_steps WHERE id = ?', (step_id,))
            return cursor.rowcount > 0
    
    # 测试结果相关方法
    def create_test_result(self, result_data: Dict[str, Any]) -> int:
        """创建测试结果"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                INSERT INTO test_results (
                    test_case_id, status, actual_result, notes, executed_by, executed_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                result_data['test_case_id'],
                result_data['status'],
                result_data.get('actual_result', ''),
                result_data.get('notes', ''),
                result_data.get('executed_by', ''),
                result_data.get('executed_at', datetime.now().isoformat())
            ))
            return cursor.lastrowid
    
    def get_test_results(self, test_case_id: int) -> List[Dict[str, Any]]:
        """获取测试结果"""
        with self.get_connection() as conn:
            cursor = conn.execute('''
                SELECT * FROM test_results 
                WHERE test_case_id = ? 
                ORDER BY executed_at DESC
            ''', (test_case_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    # 统计相关方法
    def get_statistics(self) -> Dict[str, Any]:
        """获取统计数据"""
        with self.get_connection() as conn:
            # 总体统计
            cursor = conn.execute('''
                SELECT 
                    COUNT(*) as total_cases,
                    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_cases,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_cases,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_cases,
                    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_cases,
                    SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_cases
                FROM test_cases
            ''')
            overall_stats = dict(cursor.fetchone())
            
            # 按模块统计
            cursor = conn.execute('''
                SELECT 
                    m.name as module_name,
                    m.color as module_color,
                    COUNT(tc.id) as total_cases,
                    SUM(CASE WHEN tc.status = 'passed' THEN 1 ELSE 0 END) as passed_cases,
                    SUM(CASE WHEN tc.status = 'failed' THEN 1 ELSE 0 END) as failed_cases,
                    SUM(CASE WHEN tc.status = 'pending' THEN 1 ELSE 0 END) as pending_cases
                FROM test_modules m
                LEFT JOIN test_cases tc ON m.id = tc.module_id
                GROUP BY m.id, m.name, m.color
                ORDER BY m.name
            ''')
            module_stats = [dict(row) for row in cursor.fetchall()]
            
            return {
                'overall': overall_stats,
                'by_module': module_stats
            }