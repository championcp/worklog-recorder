#!/usr/bin/env python3
"""
简单的HTTP服务器，带有防缓存功能
用于解决测试管理系统的浏览器缓存问题
"""

import http.server
import socketserver
import os
import sys
from datetime import datetime

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    自定义HTTP请求处理器，添加防缓存头
    """
    
    def end_headers(self):
        """
        在响应头结束前添加防缓存头
        """
        # 添加防缓存头
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # 添加CORS头（如果需要）
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        # 添加时间戳头
        self.send_header('X-Timestamp', str(int(datetime.now().timestamp())))
        
        super().end_headers()
    
    def do_GET(self):
        """
        处理GET请求
        """
        # 记录请求
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] GET {self.path}")
        
        # 如果请求的是根路径，重定向到index.html
        if self.path == '/':
            self.path = '/index.html'
        
        # 调用父类方法处理请求
        super().do_GET()
    
    def do_OPTIONS(self):
        """
        处理OPTIONS请求（CORS预检）
        """
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        """
        自定义日志格式
        """
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def start_server(port=8000, directory=None):
    """
    启动HTTP服务器
    
    Args:
        port (int): 服务器端口
        directory (str): 服务目录
    """
    if directory:
        os.chdir(directory)
    
    # 创建服务器
    with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
        print(f"🚀 测试管理系统服务器启动成功!")
        print(f"📍 服务地址: http://localhost:{port}")
        print(f"📁 服务目录: {os.getcwd()}")
        print(f"🔄 已启用防缓存功能")
        print(f"⏰ 启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        print("💡 提示:")
        print("   - 页面右上角有强制刷新按钮")
        print("   - 所有资源文件都会添加时间戳参数")
        print("   - 数据更新时会自动提示刷新")
        print("   - 使用 Ctrl+C 停止服务器")
        print("=" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 服务器已停止 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("👋 感谢使用测试管理系统!")

if __name__ == "__main__":
    # 解析命令行参数
    port = 8000
    directory = None
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 错误: 端口号必须是数字")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        directory = sys.argv[2]
        if not os.path.exists(directory):
            print(f"❌ 错误: 目录 '{directory}' 不存在")
            sys.exit(1)
    
    # 启动服务器
    start_server(port, directory)