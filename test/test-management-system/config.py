"""
测试用例管理系统 - Python配置管理
统一管理API端点、数据库连接等配置信息
"""

import os
import json
from typing import Dict, Any, Optional


class Config:
    """配置管理类"""
    
    def __init__(self, config_file: Optional[str] = None):
        """
        初始化配置管理器
        
        Args:
            config_file: 可选的配置文件路径
        """
        # 默认配置
        self.defaults = {
            # API服务器配置
            'api': {
                'host': 'localhost',
                'port': 8000,
                'protocol': 'http',
                'base_path': '/api'
            },
            
            # 数据库配置
            'database': {
                'path': 'test_management.db',
                'backup_enabled': True,
                'backup_interval': 3600  # 1小时
            },
            
            # 应用配置
            'app': {
                'name': '测试用例管理系统',
                'version': '1.0.0',
                'debug': False,
                'log_level': 'INFO'
            },
            
            # 导入/导出配置
            'import_export': {
                'batch_size': 100,
                'timeout': 30,
                'retry_count': 3
            }
        }
        
        # 加载配置
        self.config = self._load_config(config_file)
    
    def _load_config(self, config_file: Optional[str] = None) -> Dict[str, Any]:
        """
        加载配置，优先级：环境变量 > 配置文件 > 默认值
        
        Args:
            config_file: 配置文件路径
            
        Returns:
            合并后的配置字典
        """
        config = self._deep_copy(self.defaults)
        
        # 从配置文件加载
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    file_config = json.load(f)
                    self._merge_config(config, file_config)
            except Exception as e:
                print(f"Warning: Failed to load config file {config_file}: {e}")
        
        # 从环境变量覆盖
        self._load_from_env(config)
        
        return config
    
    def _load_from_env(self, config: Dict[str, Any]) -> None:
        """从环境变量加载配置"""
        
        # API配置
        if os.getenv('API_HOST'):
            config['api']['host'] = os.getenv('API_HOST')
        if os.getenv('API_PORT'):
            try:
                config['api']['port'] = int(os.getenv('API_PORT'))
            except ValueError:
                pass
        if os.getenv('API_PROTOCOL'):
            config['api']['protocol'] = os.getenv('API_PROTOCOL')
        if os.getenv('API_BASE_PATH'):
            config['api']['base_path'] = os.getenv('API_BASE_PATH')
        
        # 数据库配置
        if os.getenv('DB_PATH'):
            config['database']['path'] = os.getenv('DB_PATH')
        
        # 应用配置
        if os.getenv('APP_DEBUG'):
            config['app']['debug'] = os.getenv('APP_DEBUG').lower() in ('true', '1', 'yes')
        if os.getenv('LOG_LEVEL'):
            config['app']['log_level'] = os.getenv('LOG_LEVEL')
    
    def _deep_copy(self, obj: Any) -> Any:
        """深拷贝对象"""
        if isinstance(obj, dict):
            return {k: self._deep_copy(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._deep_copy(item) for item in obj]
        else:
            return obj
    
    def _merge_config(self, target: Dict[str, Any], source: Dict[str, Any]) -> None:
        """深度合并配置"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._merge_config(target[key], value)
            else:
                target[key] = value
    
    def get_api_base_url(self) -> str:
        """获取API基础URL"""
        api_config = self.config['api']
        return f"{api_config['protocol']}://{api_config['host']}:{api_config['port']}{api_config['base_path']}"
    
    def get_api_url(self, endpoint: str) -> str:
        """
        获取完整的API端点URL
        
        Args:
            endpoint: API端点路径
            
        Returns:
            完整的URL
        """
        base_url = self.get_api_base_url()
        # 确保endpoint以/开头
        clean_endpoint = endpoint if endpoint.startswith('/') else f'/{endpoint}'
        return f"{base_url}{clean_endpoint}"
    
    def get_server_base_url(self) -> str:
        """获取服务器基础URL（不包含/api路径）"""
        api_config = self.config['api']
        return f"{api_config['protocol']}://{api_config['host']}:{api_config['port']}"
    
    def get(self, path: str, default: Any = None) -> Any:
        """
        获取配置值
        
        Args:
            path: 配置路径，使用点号分隔，如 'api.host'
            default: 默认值
            
        Returns:
            配置值
        """
        keys = path.split('.')
        value = self.config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    def set(self, path: str, value: Any) -> None:
        """
        设置配置值
        
        Args:
            path: 配置路径，使用点号分隔
            value: 要设置的值
        """
        keys = path.split('.')
        target = self.config
        
        for key in keys[:-1]:
            if key not in target or not isinstance(target[key], dict):
                target[key] = {}
            target = target[key]
        
        target[keys[-1]] = value
    
    def save_to_file(self, file_path: str) -> None:
        """
        保存配置到文件
        
        Args:
            file_path: 文件路径
        """
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error: Failed to save config to {file_path}: {e}")
    
    def get_debug_info(self) -> Dict[str, Any]:
        """获取调试信息"""
        return {
            'config': self.config,
            'api_base_url': self.get_api_base_url(),
            'server_base_url': self.get_server_base_url(),
            'environment_variables': {
                key: value for key, value in os.environ.items() 
                if key.startswith(('API_', 'DB_', 'APP_', 'LOG_'))
            }
        }
    
    def debug(self) -> None:
        """打印调试信息"""
        if self.get('app.debug', False):
            print("🔧 测试用例管理系统 - 配置信息")
            print(f"API Base URL: {self.get_api_base_url()}")
            print(f"Server Base URL: {self.get_server_base_url()}")
            print(f"Database Path: {self.get('database.path')}")
            print(f"Debug Mode: {self.get('app.debug')}")


# 创建全局配置实例
app_config = Config()

# 便捷函数
def get_api_base_url() -> str:
    """获取API基础URL"""
    return app_config.get_api_base_url()

def get_api_url(endpoint: str) -> str:
    """获取API端点URL"""
    return app_config.get_api_url(endpoint)

def get_server_base_url() -> str:
    """获取服务器基础URL"""
    return app_config.get_server_base_url()

def get_config(path: str, default: Any = None) -> Any:
    """获取配置值"""
    return app_config.get(path, default)

def set_config(path: str, value: Any) -> None:
    """设置配置值"""
    app_config.set(path, value)


# 在调试模式下打印配置信息
if __name__ == '__main__':
    app_config.debug()
    print("\n示例用法:")
    print(f"API Base URL: {get_api_base_url()}")
    print(f"Test Cases API: {get_api_url('/test-cases')}")
    print(f"Modules API: {get_api_url('/test-cases/modules')}")