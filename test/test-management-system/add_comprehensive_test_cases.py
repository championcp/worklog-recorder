#!/usr/bin/env python3
"""
工作日志管理软件 - 综合测试用例添加脚本
为所有功能模块添加详细的测试用例
"""

import sys
import os
from database import TestDatabase

def add_comprehensive_test_cases():
    """添加工作日志管理软件的所有功能性测试用例"""
    
    # 初始化数据库
    db = TestDatabase()
    
    # 定义所有测试模块
    modules = [
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
        {'name': '设置', 'description': '个人设置、系统配置', 'color': '#16a085', 'icon': '⚙️'},
        {'name': '模板管理', 'description': '模板创建、编辑、应用', 'color': '#8e44ad', 'icon': '📄'}
    ]
    
    # 详细的测试用例定义
    test_cases_data = {
        '用户认证': [
            {
                'title': '用户注册功能测试',
                'description': '测试新用户注册流程的完整性和数据验证',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '用户成功注册并收到确认信息',
                'steps': [
                    {'step_number': 1, 'description': '访问注册页面', 'expected_result': '注册页面正常显示'},
                    {'step_number': 2, 'description': '输入有效的用户名', 'expected_result': '用户名格式验证通过'},
                    {'step_number': 3, 'description': '输入有效的邮箱地址', 'expected_result': '邮箱格式验证通过'},
                    {'step_number': 4, 'description': '输入符合要求的密码', 'expected_result': '密码强度验证通过'},
                    {'step_number': 5, 'description': '确认密码输入', 'expected_result': '密码确认匹配'},
                    {'step_number': 6, 'description': '点击注册按钮', 'expected_result': '注册成功，跳转到登录页面'}
                ]
            },
            {
                'title': '用户登录功能测试',
                'description': '测试用户登录流程和身份验证',
                'priority': 'high',
                'estimated_time': '15分钟',
                'expected_result': '用户成功登录并跳转到仪表板',
                'steps': [
                    {'step_number': 1, 'description': '访问登录页面', 'expected_result': '登录页面正常显示'},
                    {'step_number': 2, 'description': '输入正确的用户名/邮箱', 'expected_result': '输入框接受输入'},
                    {'step_number': 3, 'description': '输入正确的密码', 'expected_result': '密码输入正常'},
                    {'step_number': 4, 'description': '点击登录按钮', 'expected_result': '登录成功，跳转到仪表板'},
                    {'step_number': 5, 'description': '验证用户会话状态', 'expected_result': '用户状态显示为已登录'}
                ]
            },
            {
                'title': '密码重置功能测试',
                'description': '测试忘记密码和密码重置流程',
                'priority': 'medium',
                'estimated_time': '25分钟',
                'expected_result': '用户成功重置密码并能够使用新密码登录',
                'steps': [
                    {'step_number': 1, 'description': '点击"忘记密码"链接', 'expected_result': '跳转到密码重置页面'},
                    {'step_number': 2, 'description': '输入注册邮箱', 'expected_result': '邮箱格式验证通过'},
                    {'step_number': 3, 'description': '点击发送重置链接', 'expected_result': '系统发送重置邮件'},
                    {'step_number': 4, 'description': '检查邮箱并点击重置链接', 'expected_result': '跳转到密码重置页面'},
                    {'step_number': 5, 'description': '输入新密码', 'expected_result': '新密码格式验证通过'},
                    {'step_number': 6, 'description': '确认新密码', 'expected_result': '密码确认匹配'},
                    {'step_number': 7, 'description': '提交密码重置', 'expected_result': '密码重置成功'},
                    {'step_number': 8, 'description': '使用新密码登录', 'expected_result': '登录成功'}
                ]
            },
            {
                'title': '用户权限验证测试',
                'description': '测试不同用户角色的权限控制',
                'priority': 'high',
                'estimated_time': '30分钟',
                'expected_result': '不同角色用户只能访问授权的功能',
                'steps': [
                    {'step_number': 1, 'description': '以普通用户身份登录', 'expected_result': '登录成功'},
                    {'step_number': 2, 'description': '尝试访问管理员功能', 'expected_result': '访问被拒绝，显示权限不足'},
                    {'step_number': 3, 'description': '验证普通用户可访问功能', 'expected_result': '正常访问个人功能'},
                    {'step_number': 4, 'description': '以管理员身份登录', 'expected_result': '登录成功'},
                    {'step_number': 5, 'description': '验证管理员权限', 'expected_result': '可以访问所有功能'}
                ]
            }
        ],
        
        '仪表板': [
            {
                'title': '仪表板数据展示测试',
                'description': '测试仪表板各项数据的正确显示',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '仪表板正确显示所有统计数据',
                'steps': [
                    {'step_number': 1, 'description': '登录并访问仪表板', 'expected_result': '仪表板页面正常加载'},
                    {'step_number': 2, 'description': '检查任务统计卡片', 'expected_result': '显示正确的任务数量统计'},
                    {'step_number': 3, 'description': '检查时间统计卡片', 'expected_result': '显示正确的时间统计'},
                    {'step_number': 4, 'description': '检查日志统计卡片', 'expected_result': '显示正确的日志统计'},
                    {'step_number': 5, 'description': '验证数据实时性', 'expected_result': '数据与实际情况一致'}
                ]
            },
            {
                'title': '仪表板图表功能测试',
                'description': '测试仪表板中各种图表的显示和交互',
                'priority': 'medium',
                'estimated_time': '25分钟',
                'expected_result': '所有图表正常显示并支持交互',
                'steps': [
                    {'step_number': 1, 'description': '检查任务完成趋势图', 'expected_result': '趋势图正确显示数据'},
                    {'step_number': 2, 'description': '检查时间分布饼图', 'expected_result': '饼图正确显示时间分布'},
                    {'step_number': 3, 'description': '测试图表交互功能', 'expected_result': '鼠标悬停显示详细信息'},
                    {'step_number': 4, 'description': '测试图表筛选功能', 'expected_result': '筛选条件正确影响图表显示'},
                    {'step_number': 5, 'description': '测试图表导出功能', 'expected_result': '图表可以正确导出'}
                ]
            },
            {
                'title': '仪表板响应式设计测试',
                'description': '测试仪表板在不同设备上的显示效果',
                'priority': 'medium',
                'estimated_time': '15分钟',
                'expected_result': '仪表板在各种设备上都能正常显示',
                'steps': [
                    {'step_number': 1, 'description': '在桌面浏览器中查看', 'expected_result': '布局完整，所有元素正常显示'},
                    {'step_number': 2, 'description': '在平板设备中查看', 'expected_result': '布局自适应，功能正常'},
                    {'step_number': 3, 'description': '在手机设备中查看', 'expected_result': '移动端布局合理，可正常操作'},
                    {'step_number': 4, 'description': '测试不同分辨率', 'expected_result': '在各种分辨率下都能正常显示'}
                ]
            }
        ],
        
        '任务管理': [
            {
                'title': '创建新任务功能测试',
                'description': '测试创建新任务的完整流程',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '任务成功创建并显示在任务列表中',
                'steps': [
                    {'step_number': 1, 'description': '点击"创建任务"按钮', 'expected_result': '打开任务创建表单'},
                    {'step_number': 2, 'description': '输入任务标题', 'expected_result': '标题输入正常'},
                    {'step_number': 3, 'description': '输入任务描述', 'expected_result': '描述输入正常'},
                    {'step_number': 4, 'description': '选择任务分类', 'expected_result': '分类选择正常'},
                    {'step_number': 5, 'description': '设置任务优先级', 'expected_result': '优先级设置正常'},
                    {'step_number': 6, 'description': '设置截止日期', 'expected_result': '日期选择正常'},
                    {'step_number': 7, 'description': '添加标签', 'expected_result': '标签添加正常'},
                    {'step_number': 8, 'description': '点击保存按钮', 'expected_result': '任务创建成功，返回任务列表'}
                ]
            },
            {
                'title': '任务编辑功能测试',
                'description': '测试编辑现有任务的功能',
                'priority': 'high',
                'estimated_time': '15分钟',
                'expected_result': '任务信息成功更新',
                'steps': [
                    {'step_number': 1, 'description': '选择要编辑的任务', 'expected_result': '任务详情显示'},
                    {'step_number': 2, 'description': '点击编辑按钮', 'expected_result': '进入编辑模式'},
                    {'step_number': 3, 'description': '修改任务信息', 'expected_result': '修改操作正常'},
                    {'step_number': 4, 'description': '保存修改', 'expected_result': '任务信息更新成功'},
                    {'step_number': 5, 'description': '验证修改结果', 'expected_result': '修改内容正确保存'}
                ]
            },
            {
                'title': '任务状态管理测试',
                'description': '测试任务状态的变更和管理',
                'priority': 'high',
                'estimated_time': '18分钟',
                'expected_result': '任务状态正确变更并记录历史',
                'steps': [
                    {'step_number': 1, 'description': '创建新任务（待办状态）', 'expected_result': '任务状态为待办'},
                    {'step_number': 2, 'description': '将任务状态改为进行中', 'expected_result': '状态更新为进行中'},
                    {'step_number': 3, 'description': '将任务状态改为已完成', 'expected_result': '状态更新为已完成'},
                    {'step_number': 4, 'description': '查看状态变更历史', 'expected_result': '历史记录完整显示'},
                    {'step_number': 5, 'description': '测试状态回退', 'expected_result': '可以回退到之前状态'}
                ]
            },
            {
                'title': '任务搜索和筛选测试',
                'description': '测试任务的搜索和筛选功能',
                'priority': 'medium',
                'estimated_time': '22分钟',
                'expected_result': '搜索和筛选功能正常工作',
                'steps': [
                    {'step_number': 1, 'description': '使用关键词搜索任务', 'expected_result': '返回相关任务结果'},
                    {'step_number': 2, 'description': '按状态筛选任务', 'expected_result': '显示指定状态的任务'},
                    {'step_number': 3, 'description': '按优先级筛选任务', 'expected_result': '显示指定优先级的任务'},
                    {'step_number': 4, 'description': '按分类筛选任务', 'expected_result': '显示指定分类的任务'},
                    {'step_number': 5, 'description': '按标签筛选任务', 'expected_result': '显示包含指定标签的任务'},
                    {'step_number': 6, 'description': '组合多个筛选条件', 'expected_result': '正确应用多重筛选'}
                ]
            },
            {
                'title': '任务删除功能测试',
                'description': '测试任务删除功能和数据安全',
                'priority': 'medium',
                'estimated_time': '12分钟',
                'expected_result': '任务安全删除，相关数据正确处理',
                'steps': [
                    {'step_number': 1, 'description': '选择要删除的任务', 'expected_result': '任务选中'},
                    {'step_number': 2, 'description': '点击删除按钮', 'expected_result': '显示确认对话框'},
                    {'step_number': 3, 'description': '确认删除操作', 'expected_result': '任务从列表中移除'},
                    {'step_number': 4, 'description': '验证相关数据处理', 'expected_result': '相关时间记录和日志正确处理'},
                    {'step_number': 5, 'description': '检查删除历史记录', 'expected_result': '删除操作被记录'}
                ]
            }
        ],
        
        '分类管理': [
            {
                'title': '创建新分类功能测试',
                'description': '测试创建新任务分类的功能',
                'priority': 'high',
                'estimated_time': '15分钟',
                'expected_result': '分类成功创建并可用于任务分类',
                'steps': [
                    {'step_number': 1, 'description': '访问分类管理页面', 'expected_result': '页面正常加载'},
                    {'step_number': 2, 'description': '点击"创建分类"按钮', 'expected_result': '打开分类创建表单'},
                    {'step_number': 3, 'description': '输入分类名称', 'expected_result': '名称输入正常'},
                    {'step_number': 4, 'description': '输入分类描述', 'expected_result': '描述输入正常'},
                    {'step_number': 5, 'description': '选择分类颜色', 'expected_result': '颜色选择正常'},
                    {'step_number': 6, 'description': '保存分类', 'expected_result': '分类创建成功'}
                ]
            },
            {
                'title': '分类层级管理测试',
                'description': '测试分类的层级结构管理',
                'priority': 'medium',
                'estimated_time': '20分钟',
                'expected_result': '分类层级结构正确建立和管理',
                'steps': [
                    {'step_number': 1, 'description': '创建父级分类', 'expected_result': '父级分类创建成功'},
                    {'step_number': 2, 'description': '创建子级分类', 'expected_result': '子级分类创建成功'},
                    {'step_number': 3, 'description': '设置分类层级关系', 'expected_result': '层级关系正确建立'},
                    {'step_number': 4, 'description': '测试分类移动功能', 'expected_result': '分类可以在层级间移动'},
                    {'step_number': 5, 'description': '验证层级显示', 'expected_result': '层级结构正确显示'}
                ]
            },
            {
                'title': '分类排序功能测试',
                'description': '测试分类的排序和重新排列功能',
                'priority': 'medium',
                'estimated_time': '12分钟',
                'expected_result': '分类顺序可以自定义调整',
                'steps': [
                    {'step_number': 1, 'description': '查看当前分类顺序', 'expected_result': '分类按默认顺序显示'},
                    {'step_number': 2, 'description': '拖拽调整分类顺序', 'expected_result': '拖拽操作正常'},
                    {'step_number': 3, 'description': '保存新的排序', 'expected_result': '新顺序保存成功'},
                    {'step_number': 4, 'description': '刷新页面验证', 'expected_result': '新顺序持久保存'}
                ]
            }
        ],
        
        '标签管理': [
            {
                'title': '创建和管理标签测试',
                'description': '测试标签的创建、编辑和删除功能',
                'priority': 'high',
                'estimated_time': '18分钟',
                'expected_result': '标签管理功能完全正常',
                'steps': [
                    {'step_number': 1, 'description': '创建新标签', 'expected_result': '标签创建成功'},
                    {'step_number': 2, 'description': '编辑标签信息', 'expected_result': '标签信息更新成功'},
                    {'step_number': 3, 'description': '设置标签颜色', 'expected_result': '标签颜色设置成功'},
                    {'step_number': 4, 'description': '删除不需要的标签', 'expected_result': '标签删除成功'},
                    {'step_number': 5, 'description': '验证标签使用情况', 'expected_result': '显示标签使用统计'}
                ]
            },
            {
                'title': '标签搜索功能测试',
                'description': '测试标签的搜索和筛选功能',
                'priority': 'medium',
                'estimated_time': '15分钟',
                'expected_result': '标签搜索功能正常工作',
                'steps': [
                    {'step_number': 1, 'description': '使用关键词搜索标签', 'expected_result': '返回匹配的标签'},
                    {'step_number': 2, 'description': '按使用频率筛选', 'expected_result': '按频率正确排序'},
                    {'step_number': 3, 'description': '按创建时间筛选', 'expected_result': '按时间正确排序'},
                    {'step_number': 4, 'description': '测试模糊搜索', 'expected_result': '模糊搜索正常工作'}
                ]
            }
        ],
        
        '计划管理': [
            {
                'title': '创建工作计划测试',
                'description': '测试创建新工作计划的功能',
                'priority': 'high',
                'estimated_time': '25分钟',
                'expected_result': '工作计划成功创建并可以管理',
                'steps': [
                    {'step_number': 1, 'description': '点击"创建计划"按钮', 'expected_result': '打开计划创建表单'},
                    {'step_number': 2, 'description': '输入计划标题', 'expected_result': '标题输入正常'},
                    {'step_number': 3, 'description': '设置计划时间范围', 'expected_result': '时间范围设置正常'},
                    {'step_number': 4, 'description': '添加计划目标', 'expected_result': '目标添加正常'},
                    {'step_number': 5, 'description': '关联相关任务', 'expected_result': '任务关联成功'},
                    {'step_number': 6, 'description': '保存计划', 'expected_result': '计划创建成功'}
                ]
            },
            {
                'title': '计划进度跟踪测试',
                'description': '测试计划执行进度的跟踪功能',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '计划进度正确跟踪和显示',
                'steps': [
                    {'step_number': 1, 'description': '查看计划进度概览', 'expected_result': '进度信息正确显示'},
                    {'step_number': 2, 'description': '更新任务完成状态', 'expected_result': '计划进度自动更新'},
                    {'step_number': 3, 'description': '查看进度图表', 'expected_result': '图表正确反映进度'},
                    {'step_number': 4, 'description': '设置里程碑', 'expected_result': '里程碑设置成功'},
                    {'step_number': 5, 'description': '验证进度计算', 'expected_result': '进度计算准确'}
                ]
            }
        ],
        
        '时间记录': [
            {
                'title': '时间计时功能测试',
                'description': '测试任务时间计时的准确性',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '时间计时准确，数据正确记录',
                'steps': [
                    {'step_number': 1, 'description': '选择任务开始计时', 'expected_result': '计时器开始运行'},
                    {'step_number': 2, 'description': '暂停计时', 'expected_result': '计时器暂停'},
                    {'step_number': 3, 'description': '恢复计时', 'expected_result': '计时器继续运行'},
                    {'step_number': 4, 'description': '停止计时', 'expected_result': '时间记录保存'},
                    {'step_number': 5, 'description': '验证时间记录', 'expected_result': '记录时间准确'}
                ]
            },
            {
                'title': '手动时间记录测试',
                'description': '测试手动添加时间记录的功能',
                'priority': 'medium',
                'estimated_time': '15分钟',
                'expected_result': '手动时间记录功能正常',
                'steps': [
                    {'step_number': 1, 'description': '点击"添加时间记录"', 'expected_result': '打开时间记录表单'},
                    {'step_number': 2, 'description': '选择相关任务', 'expected_result': '任务选择正常'},
                    {'step_number': 3, 'description': '输入开始时间', 'expected_result': '时间输入正常'},
                    {'step_number': 4, 'description': '输入结束时间', 'expected_result': '时间输入正常'},
                    {'step_number': 5, 'description': '添加工作描述', 'expected_result': '描述输入正常'},
                    {'step_number': 6, 'description': '保存时间记录', 'expected_result': '记录保存成功'}
                ]
            },
            {
                'title': '时间统计报告测试',
                'description': '测试时间统计和报告生成功能',
                'priority': 'medium',
                'estimated_time': '18分钟',
                'expected_result': '时间统计准确，报告生成正常',
                'steps': [
                    {'step_number': 1, 'description': '查看日时间统计', 'expected_result': '日统计数据正确'},
                    {'step_number': 2, 'description': '查看周时间统计', 'expected_result': '周统计数据正确'},
                    {'step_number': 3, 'description': '查看月时间统计', 'expected_result': '月统计数据正确'},
                    {'step_number': 4, 'description': '生成时间报告', 'expected_result': '报告生成成功'},
                    {'step_number': 5, 'description': '导出时间数据', 'expected_result': '数据导出成功'}
                ]
            }
        ],
        
        '工作日志': [
            {
                'title': '创建工作日志测试',
                'description': '测试创建新工作日志的功能',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '工作日志成功创建并保存',
                'steps': [
                    {'step_number': 1, 'description': '点击"创建日志"按钮', 'expected_result': '打开日志编辑器'},
                    {'step_number': 2, 'description': '输入日志标题', 'expected_result': '标题输入正常'},
                    {'step_number': 3, 'description': '编写日志内容', 'expected_result': '内容编辑正常'},
                    {'step_number': 4, 'description': '添加相关任务', 'expected_result': '任务关联成功'},
                    {'step_number': 5, 'description': '添加标签', 'expected_result': '标签添加成功'},
                    {'step_number': 6, 'description': '保存日志', 'expected_result': '日志保存成功'}
                ]
            },
            {
                'title': '日志模板功能测试',
                'description': '测试使用模板创建日志的功能',
                'priority': 'medium',
                'estimated_time': '15分钟',
                'expected_result': '模板功能正常，提高日志创建效率',
                'steps': [
                    {'step_number': 1, 'description': '选择日志模板', 'expected_result': '模板列表正常显示'},
                    {'step_number': 2, 'description': '应用选中模板', 'expected_result': '模板内容正确填充'},
                    {'step_number': 3, 'description': '修改模板内容', 'expected_result': '内容修改正常'},
                    {'step_number': 4, 'description': '保存基于模板的日志', 'expected_result': '日志保存成功'}
                ]
            },
            {
                'title': '日志搜索功能测试',
                'description': '测试日志的搜索和筛选功能',
                'priority': 'medium',
                'estimated_time': '18分钟',
                'expected_result': '日志搜索功能完全正常',
                'steps': [
                    {'step_number': 1, 'description': '使用关键词搜索日志', 'expected_result': '返回相关日志'},
                    {'step_number': 2, 'description': '按日期范围筛选', 'expected_result': '日期筛选正常'},
                    {'step_number': 3, 'description': '按标签筛选日志', 'expected_result': '标签筛选正常'},
                    {'step_number': 4, 'description': '按任务筛选日志', 'expected_result': '任务筛选正常'},
                    {'step_number': 5, 'description': '全文搜索功能', 'expected_result': '全文搜索正常工作'}
                ]
            }
        ],
        
        '统计分析': [
            {
                'title': '工作效率统计测试',
                'description': '测试工作效率相关的统计分析功能',
                'priority': 'high',
                'estimated_time': '25分钟',
                'expected_result': '统计数据准确，分析结果有意义',
                'steps': [
                    {'step_number': 1, 'description': '查看任务完成率统计', 'expected_result': '完成率数据正确'},
                    {'step_number': 2, 'description': '查看时间分布统计', 'expected_result': '时间分布数据正确'},
                    {'step_number': 3, 'description': '查看效率趋势分析', 'expected_result': '趋势分析合理'},
                    {'step_number': 4, 'description': '生成效率报告', 'expected_result': '报告生成成功'},
                    {'step_number': 5, 'description': '对比不同时期数据', 'expected_result': '对比分析正确'}
                ]
            },
            {
                'title': '数据可视化测试',
                'description': '测试各种图表和可视化功能',
                'priority': 'medium',
                'estimated_time': '20分钟',
                'expected_result': '图表显示正确，交互功能正常',
                'steps': [
                    {'step_number': 1, 'description': '查看柱状图统计', 'expected_result': '柱状图正确显示'},
                    {'step_number': 2, 'description': '查看饼图统计', 'expected_result': '饼图正确显示'},
                    {'step_number': 3, 'description': '查看折线图趋势', 'expected_result': '折线图正确显示'},
                    {'step_number': 4, 'description': '测试图表交互', 'expected_result': '交互功能正常'},
                    {'step_number': 5, 'description': '导出图表', 'expected_result': '图表导出成功'}
                ]
            }
        ],
        
        '报告管理': [
            {
                'title': '生成工作报告测试',
                'description': '测试各种工作报告的生成功能',
                'priority': 'high',
                'estimated_time': '30分钟',
                'expected_result': '报告生成成功，内容完整准确',
                'steps': [
                    {'step_number': 1, 'description': '选择报告类型', 'expected_result': '报告类型选择正常'},
                    {'step_number': 2, 'description': '设置报告时间范围', 'expected_result': '时间范围设置正常'},
                    {'step_number': 3, 'description': '选择报告内容', 'expected_result': '内容选择正常'},
                    {'step_number': 4, 'description': '生成报告', 'expected_result': '报告生成成功'},
                    {'step_number': 5, 'description': '预览报告内容', 'expected_result': '报告内容正确'},
                    {'step_number': 6, 'description': '导出报告', 'expected_result': '报告导出成功'}
                ]
            },
            {
                'title': '报告分享功能测试',
                'description': '测试报告的分享和协作功能',
                'priority': 'medium',
                'estimated_time': '15分钟',
                'expected_result': '报告分享功能正常工作',
                'steps': [
                    {'step_number': 1, 'description': '生成分享链接', 'expected_result': '分享链接生成成功'},
                    {'step_number': 2, 'description': '设置分享权限', 'expected_result': '权限设置正常'},
                    {'step_number': 3, 'description': '通过邮件分享', 'expected_result': '邮件发送成功'},
                    {'step_number': 4, 'description': '验证分享访问', 'expected_result': '分享访问正常'}
                ]
            }
        ],
        
        '设置': [
            {
                'title': '个人设置管理测试',
                'description': '测试个人设置的修改和保存功能',
                'priority': 'medium',
                'estimated_time': '20分钟',
                'expected_result': '个人设置正确保存和应用',
                'steps': [
                    {'step_number': 1, 'description': '修改个人信息', 'expected_result': '信息修改成功'},
                    {'step_number': 2, 'description': '更改密码', 'expected_result': '密码更改成功'},
                    {'step_number': 3, 'description': '设置通知偏好', 'expected_result': '通知设置保存成功'},
                    {'step_number': 4, 'description': '修改界面主题', 'expected_result': '主题切换成功'},
                    {'step_number': 5, 'description': '设置时区', 'expected_result': '时区设置成功'}
                ]
            },
            {
                'title': '系统配置测试',
                'description': '测试系统级配置的管理功能',
                'priority': 'high',
                'estimated_time': '25分钟',
                'expected_result': '系统配置正确管理和应用',
                'steps': [
                    {'step_number': 1, 'description': '配置数据备份设置', 'expected_result': '备份设置保存成功'},
                    {'step_number': 2, 'description': '设置系统通知', 'expected_result': '通知设置成功'},
                    {'step_number': 3, 'description': '配置集成设置', 'expected_result': '集成配置成功'},
                    {'step_number': 4, 'description': '管理用户权限', 'expected_result': '权限管理正常'},
                    {'step_number': 5, 'description': '系统日志查看', 'expected_result': '日志查看正常'}
                ]
            }
        ],
        
        '模板管理': [
            {
                'title': '创建模板功能测试',
                'description': '测试创建新模板的功能',
                'priority': 'high',
                'estimated_time': '20分钟',
                'expected_result': '模板成功创建并可以使用',
                'steps': [
                    {'step_number': 1, 'description': '点击"创建模板"按钮', 'expected_result': '打开模板创建表单'},
                    {'step_number': 2, 'description': '输入模板名称', 'expected_result': '名称输入正常'},
                    {'step_number': 3, 'description': '选择模板类型', 'expected_result': '类型选择正常'},
                    {'step_number': 4, 'description': '编辑模板内容', 'expected_result': '内容编辑正常'},
                    {'step_number': 5, 'description': '设置模板变量', 'expected_result': '变量设置成功'},
                    {'step_number': 6, 'description': '保存模板', 'expected_result': '模板保存成功'}
                ]
            },
            {
                'title': '模板应用功能测试',
                'description': '测试使用模板创建内容的功能',
                'priority': 'high',
                'estimated_time': '15分钟',
                'expected_result': '模板应用功能正常，提高工作效率',
                'steps': [
                    {'step_number': 1, 'description': '选择要使用的模板', 'expected_result': '模板选择正常'},
                    {'step_number': 2, 'description': '填写模板变量', 'expected_result': '变量填写正常'},
                    {'step_number': 3, 'description': '预览生成内容', 'expected_result': '预览显示正确'},
                    {'step_number': 4, 'description': '应用模板创建内容', 'expected_result': '内容创建成功'},
                    {'step_number': 5, 'description': '验证模板效果', 'expected_result': '模板效果符合预期'}
                ]
            },
            {
                'title': '模板管理功能测试',
                'description': '测试模板的编辑、删除和管理功能',
                'priority': 'medium',
                'estimated_time': '18分钟',
                'expected_result': '模板管理功能完全正常',
                'steps': [
                    {'step_number': 1, 'description': '编辑现有模板', 'expected_result': '模板编辑成功'},
                    {'step_number': 2, 'description': '复制模板', 'expected_result': '模板复制成功'},
                    {'step_number': 3, 'description': '删除不需要的模板', 'expected_result': '模板删除成功'},
                    {'step_number': 4, 'description': '查看模板使用统计', 'expected_result': '统计信息正确'},
                    {'step_number': 5, 'description': '导入导出模板', 'expected_result': '导入导出功能正常'}
                ]
            }
        ]
    }
    
    print("开始添加工作日志管理软件的综合测试用例...")
    
    # 创建模块并添加测试用例
    for module_data in modules:
        print(f"\n处理模块: {module_data['name']}")
        
        # 检查模块是否已存在
        existing_modules = db.get_modules()
        existing_module = None
        for existing in existing_modules:
            if existing['name'] == module_data['name']:
                existing_module = existing
                break
        
        if existing_module:
            module_id = existing_module['id']
            print(f"  模块已存在，ID: {module_id}")
        else:
            module_id = db.create_module(module_data)
            print(f"  创建新模块，ID: {module_id}")
        
        # 添加该模块的测试用例
        if module_data['name'] in test_cases_data:
            test_cases = test_cases_data[module_data['name']]
            print(f"  添加 {len(test_cases)} 个测试用例")
            
            for test_case in test_cases:
                test_case['module_id'] = module_id
                test_case_id = db.create_test_case(test_case)
                print(f"    创建测试用例: {test_case['title']} (ID: {test_case_id})")
                
                # 添加测试步骤
                if 'steps' in test_case:
                    for step in test_case['steps']:
                        step['test_case_id'] = test_case_id
                        step_id = db.create_test_step(step)
                        print(f"      添加步骤 {step['step_number']}: {step['description']}")
    
    print("\n✅ 所有测试用例添加完成！")
    
    # 显示统计信息
    stats = db.get_statistics()
    print(f"\n📊 测试用例统计:")
    print(f"  总模块数: {len(db.get_modules())}")
    print(f"  总测试用例数: {stats.get('total_cases', 0)}")
    print(f"  待测试用例数: {stats.get('pending_cases', 0)}")

if __name__ == "__main__":
    add_comprehensive_test_cases()