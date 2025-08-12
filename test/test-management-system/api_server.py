#!/usr/bin/env python3
"""
测试用例管理系统 Flask API 服务器
提供RESTful API接口用于管理测试模块、测试用例、测试步骤和测试结果
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime
from database import TestDatabase

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 初始化数据库
db = TestDatabase()

# 通用响应格式
def success_response(data=None, message="操作成功"):
    """成功响应格式"""
    return jsonify({
        "success": True,
        "data": data,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })

def error_response(message="操作失败", status_code=400):
    """错误响应格式"""
    response = jsonify({
        "success": False,
        "error": message,
        "timestamp": datetime.now().isoformat()
    })
    response.status_code = status_code
    return response

# 静态文件服务
@app.route('/')
def index():
    """主页"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """静态文件服务"""
    return send_from_directory('.', filename)

# API路由

# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return success_response({
        "status": "healthy",
        "service": "测试用例管理系统",
        "version": "1.0.0"
    })

# 测试模块相关API
@app.route('/api/test-cases/modules', methods=['GET'])
def get_modules():
    """获取所有测试模块"""
    try:
        modules = db.get_modules()
        return success_response(modules)
    except Exception as e:
        return error_response(f"获取模块失败: {str(e)}")

@app.route('/api/test-cases/modules', methods=['POST'])
def create_module():
    """创建测试模块"""
    try:
        data = request.get_json()
        if not data or not data.get('name'):
            return error_response("模块名称不能为空")
        
        module_id = db.create_module(data)
        module = db.get_module(module_id)
        return success_response(module, "模块创建成功")
    except Exception as e:
        return error_response(f"创建模块失败: {str(e)}")

@app.route('/api/test-cases/modules/<int:module_id>', methods=['GET'])
def get_module(module_id):
    """获取单个测试模块"""
    try:
        module = db.get_module(module_id)
        if not module:
            return error_response("模块不存在", 404)
        return success_response(module)
    except Exception as e:
        return error_response(f"获取模块失败: {str(e)}")

@app.route('/api/test-cases/modules/<int:module_id>', methods=['PUT'])
def update_module(module_id):
    """更新测试模块"""
    try:
        data = request.get_json()
        if not data or not data.get('name'):
            return error_response("模块名称不能为空")
        
        success = db.update_module(module_id, data)
        if not success:
            return error_response("模块不存在", 404)
        
        module = db.get_module(module_id)
        return success_response(module, "模块更新成功")
    except Exception as e:
        return error_response(f"更新模块失败: {str(e)}")

@app.route('/api/test-cases/modules/<int:module_id>', methods=['DELETE'])
def delete_module(module_id):
    """删除测试模块"""
    try:
        success = db.delete_module(module_id)
        if not success:
            return error_response("模块不存在", 404)
        return success_response(None, "模块删除成功")
    except Exception as e:
        return error_response(f"删除模块失败: {str(e)}")

# 测试用例相关API
@app.route('/api/test-cases', methods=['GET'])
def get_test_cases():
    """获取测试用例"""
    try:
        module_id = request.args.get('moduleId', type=int)
        test_cases = db.get_test_cases(module_id)
        
        # 为每个测试用例添加步骤信息
        for test_case in test_cases:
            steps = db.get_test_steps(test_case['id'])
            test_case['steps'] = [step['description'] for step in steps]
        
        return success_response(test_cases)
    except Exception as e:
        return error_response(f"获取测试用例失败: {str(e)}")

@app.route('/api/test-cases', methods=['POST'])
def create_test_case():
    """创建测试用例"""
    try:
        data = request.get_json()
        if not data or not data.get('title') or not data.get('module_id'):
            return error_response("标题和模块ID不能为空")
        
        test_case_id = db.create_test_case(data)
        
        # 如果有步骤数据，创建步骤
        if 'steps' in data and isinstance(data['steps'], list):
            for i, step_desc in enumerate(data['steps'], 1):
                if step_desc.strip():  # 只创建非空步骤
                    step_data = {
                        'test_case_id': test_case_id,
                        'step_number': i,
                        'description': step_desc.strip()
                    }
                    db.create_test_step(step_data)
        
        test_case = db.get_test_case(test_case_id)
        return success_response(test_case, "测试用例创建成功")
    except Exception as e:
        return error_response(f"创建测试用例失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>', methods=['GET'])
def get_test_case(test_case_id):
    """获取单个测试用例"""
    try:
        test_case = db.get_test_case(test_case_id)
        if not test_case:
            return error_response("测试用例不存在", 404)
        
        # 添加步骤信息
        steps = db.get_test_steps(test_case_id)
        test_case['steps'] = steps
        
        return success_response(test_case)
    except Exception as e:
        return error_response(f"获取测试用例失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>', methods=['PUT'])
def update_test_case(test_case_id):
    """更新测试用例"""
    try:
        data = request.get_json()
        if not data or not data.get('title'):
            return error_response("标题不能为空")
        
        success = db.update_test_case(test_case_id, data)
        if not success:
            return error_response("测试用例不存在", 404)
        
        test_case = db.get_test_case(test_case_id)
        return success_response(test_case, "测试用例更新成功")
    except Exception as e:
        return error_response(f"更新测试用例失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>', methods=['DELETE'])
def delete_test_case(test_case_id):
    """删除测试用例"""
    try:
        success = db.delete_test_case(test_case_id)
        if not success:
            return error_response("测试用例不存在", 404)
        return success_response(None, "测试用例删除成功")
    except Exception as e:
        return error_response(f"删除测试用例失败: {str(e)}")

# 测试步骤相关API
@app.route('/api/test-cases/<int:test_case_id>/steps', methods=['GET'])
def get_test_steps(test_case_id):
    """获取测试步骤"""
    try:
        steps = db.get_test_steps(test_case_id)
        return success_response(steps)
    except Exception as e:
        return error_response(f"获取测试步骤失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>/steps', methods=['POST'])
def create_test_step(test_case_id):
    """创建测试步骤"""
    try:
        data = request.get_json()
        if not data or not data.get('description'):
            return error_response("步骤描述不能为空")
        
        data['test_case_id'] = test_case_id
        step_id = db.create_test_step(data)
        
        # 获取创建的步骤
        steps = db.get_test_steps(test_case_id)
        created_step = next((step for step in steps if step['id'] == step_id), None)
        
        return success_response(created_step, "测试步骤创建成功")
    except Exception as e:
        return error_response(f"创建测试步骤失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>/steps/<int:step_id>', methods=['PUT'])
def update_test_step(test_case_id, step_id):
    """更新测试步骤"""
    try:
        data = request.get_json()
        if not data or not data.get('description'):
            return error_response("步骤描述不能为空")
        
        success = db.update_test_step(step_id, data)
        if not success:
            return error_response("测试步骤不存在", 404)
        
        steps = db.get_test_steps(test_case_id)
        updated_step = next((step for step in steps if step['id'] == step_id), None)
        
        return success_response(updated_step, "测试步骤更新成功")
    except Exception as e:
        return error_response(f"更新测试步骤失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>/steps/<int:step_id>', methods=['DELETE'])
def delete_test_step(test_case_id, step_id):
    """删除测试步骤"""
    try:
        success = db.delete_test_step(step_id)
        if not success:
            return error_response("测试步骤不存在", 404)
        return success_response(None, "测试步骤删除成功")
    except Exception as e:
        return error_response(f"删除测试步骤失败: {str(e)}")

# 测试结果相关API
@app.route('/api/test-cases/<int:test_case_id>/results', methods=['GET'])
def get_test_results(test_case_id):
    """获取测试结果"""
    try:
        results = db.get_test_results(test_case_id)
        return success_response(results)
    except Exception as e:
        return error_response(f"获取测试结果失败: {str(e)}")

@app.route('/api/test-cases/<int:test_case_id>/results', methods=['POST'])
def create_test_result(test_case_id):
    """创建测试结果"""
    try:
        data = request.get_json()
        if not data or not data.get('status'):
            return error_response("测试状态不能为空")
        
        data['test_case_id'] = test_case_id
        result_id = db.create_test_result(data)
        
        # 同时更新测试用例的状态
        test_case_update = {
            'status': data['status'],
            'actual_result': data.get('actual_result', ''),
            'executed_by': data.get('executed_by', '')
        }
        
        # 获取原测试用例数据
        original_test_case = db.get_test_case(test_case_id)
        if original_test_case:
            test_case_update.update({
                'title': original_test_case['title'],
                'description': original_test_case['description'],
                'module_id': original_test_case['module_id'],
                'priority': original_test_case['priority'],
                'estimated_time': original_test_case['estimated_time'],
                'expected_result': original_test_case['expected_result']
            })
            db.update_test_case(test_case_id, test_case_update)
        
        # 获取创建的结果
        results = db.get_test_results(test_case_id)
        created_result = next((result for result in results if result['id'] == result_id), None)
        
        return success_response(created_result, "测试结果创建成功")
    except Exception as e:
        return error_response(f"创建测试结果失败: {str(e)}")

# 统计数据API
@app.route('/api/test-cases/statistics', methods=['GET'])
def get_statistics():
    """获取统计数据"""
    try:
        stats = db.get_statistics()
        return success_response(stats)
    except Exception as e:
        return error_response(f"获取统计数据失败: {str(e)}")

@app.route('/api/modules/statistics', methods=['GET'])
def get_module_statistics():
    """获取模块统计信息"""
    try:
        # 获取所有模块
        modules = db.get_modules()
        
        # 为每个模块添加统计信息
        module_stats = []
        for module in modules:
            # 获取该模块的测试用例统计
            test_cases = db.get_test_cases(module['id'])
            
            # 统计各种状态的测试用例数量
            total_cases = len(test_cases)
            passed_cases = len([tc for tc in test_cases if tc.get('status') == 'passed'])
            failed_cases = len([tc for tc in test_cases if tc.get('status') == 'failed'])
            pending_cases = len([tc for tc in test_cases if tc.get('status') in ['pending', None, '']])
            
            # 计算通过率
            pass_rate = round((passed_cases / total_cases * 100) if total_cases > 0 else 0, 1)
            
            module_stat = {
                'id': module['id'],
                'name': module['name'],
                'description': module['description'],
                'color': module.get('color', '#3498db'),
                'icon': module.get('icon', 'fas fa-cube'),
                'total_cases': total_cases,
                'passed_cases': passed_cases,
                'failed_cases': failed_cases,
                'pending_cases': pending_cases,
                'pass_rate': pass_rate,
                'status': 'active' if total_cases > 0 else 'inactive'
            }
            module_stats.append(module_stat)
        
        return success_response(module_stats)
    except Exception as e:
        return error_response(f"获取模块统计失败: {str(e)}")

# 执行测试用例API
@app.route('/api/test-cases/<int:test_case_id>/execute', methods=['POST'])
def execute_test_case(test_case_id):
    """执行测试用例"""
    try:
        data = request.get_json()
        if not data or not data.get('status'):
            return error_response("测试状态不能为空")
        
        # 创建测试结果记录
        result_data = {
            'test_case_id': test_case_id,
            'status': data['status'],
            'actual_result': data.get('actual_result', ''),
            'notes': data.get('notes', ''),
            'executed_by': data.get('executed_by', '手动测试'),
            'executed_at': datetime.now().isoformat()
        }
        
        result_id = db.create_test_result(result_data)
        
        # 更新测试用例状态
        original_test_case = db.get_test_case(test_case_id)
        if original_test_case:
            test_case_update = {
                'title': original_test_case['title'],
                'description': original_test_case['description'],
                'module_id': original_test_case['module_id'],
                'priority': original_test_case['priority'],
                'estimated_time': original_test_case['estimated_time'],
                'expected_result': original_test_case['expected_result'],
                'status': data['status'],
                'actual_result': data.get('actual_result', ''),
                'executed_by': data.get('executed_by', '手动测试')
            }
            db.update_test_case(test_case_id, test_case_update)
        
        # 返回更新后的测试用例
        updated_test_case = db.get_test_case(test_case_id)
        return success_response(updated_test_case, "测试用例执行完成")
    except Exception as e:
        return error_response(f"执行测试用例失败: {str(e)}")

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return error_response("接口不存在", 404)

@app.errorhandler(500)
def internal_error(error):
    return error_response("服务器内部错误", 500)

if __name__ == '__main__':
    # 解析命令行参数
    port = 8000
    debug = False
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 错误: 端口号必须是数字")
            sys.exit(1)
    
    if len(sys.argv) > 2 and sys.argv[2] == '--debug':
        debug = True
    
    print("🚀 测试用例管理系统 API 服务器启动中...")
    print(f"📍 服务地址: http://localhost:{port}")
    print(f"📊 API文档: http://localhost:{port}/api/health")
    print(f"🗄️ 数据库: {db.db_path}")
    print(f"⏰ 启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug)
    except KeyboardInterrupt:
        print(f"\n🛑 服务器已停止 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("👋 感谢使用测试用例管理系统!")