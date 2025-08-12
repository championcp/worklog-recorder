/**
 * 测试用例管理系统 - 前端配置管理
 * 统一管理API端点、端口号等配置信息
 */

class Config {
    constructor() {
        // 默认配置
        this.defaults = {
            // API配置
            api: {
                host: 'localhost',
                port: 8000,
                protocol: 'http',
                basePath: '/api'
            },
            
            // 应用配置
            app: {
                name: '测试用例管理系统',
                version: '1.0.0',
                debug: false
            },
            
            // UI配置
            ui: {
                pageSize: 20,
                autoRefresh: false,
                refreshInterval: 30000 // 30秒
            }
        };
        
        // 从环境变量或URL参数中读取配置覆盖
        this.config = this.loadConfig();
    }
    
    /**
     * 加载配置，支持环境变量和URL参数覆盖
     */
    loadConfig() {
        const config = JSON.parse(JSON.stringify(this.defaults));
        
        // 从URL参数中读取配置
        const urlParams = new URLSearchParams(window.location.search);
        
        // 支持通过URL参数覆盖API配置
        if (urlParams.has('api_host')) {
            config.api.host = urlParams.get('api_host');
        }
        if (urlParams.has('api_port')) {
            config.api.port = parseInt(urlParams.get('api_port'));
        }
        if (urlParams.has('api_protocol')) {
            config.api.protocol = urlParams.get('api_protocol');
        }
        
        // 支持通过URL参数启用调试模式
        if (urlParams.has('debug')) {
            config.app.debug = urlParams.get('debug') === 'true';
        }
        
        // 从localStorage中读取用户自定义配置
        const savedConfig = this.loadFromStorage();
        if (savedConfig) {
            this.mergeConfig(config, savedConfig);
        }
        
        return config;
    }
    
    /**
     * 从localStorage加载配置
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('testManagementConfig');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('Failed to load config from localStorage:', error);
            return null;
        }
    }
    
    /**
     * 保存配置到localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('testManagementConfig', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save config to localStorage:', error);
        }
    }
    
    /**
     * 深度合并配置对象
     */
    mergeConfig(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    this.mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
    
    /**
     * 获取API基础URL
     */
    getApiBaseUrl() {
        const { protocol, host, port, basePath } = this.config.api;
        return `${protocol}://${host}:${port}${basePath}`;
    }
    
    /**
     * 获取完整的API端点URL
     */
    getApiUrl(endpoint) {
        const baseUrl = this.getApiBaseUrl();
        // 确保endpoint以/开头
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseUrl}${cleanEndpoint}`;
    }
    
    /**
     * 获取服务器基础URL（不包含/api路径）
     */
    getServerBaseUrl() {
        const { protocol, host, port } = this.config.api;
        return `${protocol}://${host}:${port}`;
    }
    
    /**
     * 获取配置值
     */
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * 设置配置值
     */
    set(path, value) {
        const keys = path.split('.');
        let target = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[keys[keys.length - 1]] = value;
        this.saveToStorage();
    }
    
    /**
     * 重置配置为默认值
     */
    reset() {
        this.config = JSON.parse(JSON.stringify(this.defaults));
        localStorage.removeItem('testManagementConfig');
    }
    
    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            config: this.config,
            apiBaseUrl: this.getApiBaseUrl(),
            serverBaseUrl: this.getServerBaseUrl(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 打印调试信息
     */
    debug() {
        if (this.config.app.debug) {
            console.group('🔧 测试用例管理系统 - 配置信息');
            console.log('API Base URL:', this.getApiBaseUrl());
            console.log('Server Base URL:', this.getServerBaseUrl());
            console.log('完整配置:', this.config);
            console.groupEnd();
        }
    }
}

// 创建全局配置实例
window.AppConfig = new Config();

// 在调试模式下打印配置信息
window.AppConfig.debug();

// 导出配置实例（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}