#!/bin/bash

# 测试用例管理系统启动脚本
# 使用Flask API服务器提供完整的数据库支持

echo "🚀 启动测试用例管理系统..."
echo "📍 服务地址: http://localhost:8000"
echo "🗄️ 数据库: SQLite (test_management.db)"
echo "=" * 50

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3，请先安装 Python 3"
    exit 1
fi

# 检查并安装依赖
if [ -f "requirements.txt" ]; then
    echo "📦 检查Python依赖..."
    pip3 install -r requirements.txt
fi

# 启动Flask API服务器
echo "🔧 启动Flask API服务器..."
python3 api_server.py 8000