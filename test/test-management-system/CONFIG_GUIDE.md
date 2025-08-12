# 配置管理系统使用指南

## 概述

为了解决硬编码端口号和URL的问题，我们实现了一个统一的配置管理系统。该系统支持：

- 前端JavaScript配置管理
- 后端Python配置管理  
- 环境变量覆盖
- URL参数配置
- 本地存储配置

## 前端配置

### 基本用法

```javascript
// 获取API基础URL
const apiBaseUrl = window.AppConfig.getApiBaseUrl();

// 获取完整的API端点URL
const testCasesUrl = window.AppConfig.getApiUrl('/test-cases');

// 获取服务器基础URL
const serverUrl = window.AppConfig.getServerBaseUrl();

// 获取配置值
const debug = window.AppConfig.get('app.debug');
const pageSize = window.AppConfig.get('ui.pageSize');

// 设置配置值
window.AppConfig.set('app.debug', true);
```

### URL参数配置

可以通过URL参数临时覆盖配置：

```
http://localhost:8000/?api_port=9000&debug=true
```

支持的URL参数：
- `api_host`: API服务器主机名
- `api_port`: API服务器端口
- `api_protocol`: API协议 (http/https)
- `debug`: 启用调试模式

### 本地存储配置

配置会自动保存到localStorage，下次访问时会自动加载。

## 后端配置

### 基本用法

```python
from config import get_api_url, get_config, app_config

# 获取API URL
api_url = get_api_url('/test-cases')

# 获取配置值
debug = get_config('app.debug')
db_path = get_config('database.path')

# 获取API基础URL
base_url = app_config.get_api_base_url()
```

### 环境变量配置

创建 `.env` 文件或设置环境变量：

```bash
# 修改API端口
export API_PORT=9000

# 启用调试模式
export APP_DEBUG=true

# 修改数据库路径
export DB_PATH=/path/to/database.db
```

支持的环境变量：
- `API_HOST`: API服务器主机名
- `API_PORT`: API服务器端口
- `API_PROTOCOL`: API协议
- `API_BASE_PATH`: API基础路径
- `DB_PATH`: 数据库文件路径
- `APP_DEBUG`: 调试模式
- `LOG_LEVEL`: 日志级别

### 配置文件

可以创建JSON配置文件：

```python
from config import Config

# 使用自定义配置文件
config = Config('custom_config.json')
```

配置文件格式：
```json
{
  "api": {
    "host": "localhost",
    "port": 9000,
    "protocol": "http",
    "base_path": "/api"
  },
  "app": {
    "debug": true
  }
}
```

## 配置优先级

配置的优先级从高到低：

1. **环境变量** - 最高优先级
2. **配置文件** - 中等优先级  
3. **默认值** - 最低优先级

对于前端：
1. **URL参数** - 最高优先级
2. **localStorage** - 中等优先级
3. **默认值** - 最低优先级

## 迁移指南

### 从硬编码URL迁移

**之前：**
```javascript
const response = await fetch('http://localhost:8000/api/test-cases');
```

**之后：**
```javascript
const apiUrl = window.AppConfig.getApiUrl('/test-cases');
const response = await fetch(apiUrl);
```

**Python之前：**
```python
response = requests.get('http://localhost:8000/api/test-cases')
```

**Python之后：**
```python
from config import get_api_url
api_url = get_api_url('/test-cases')
response = requests.get(api_url)
```

## 调试

### 启用调试模式

**前端：**
```javascript
// 通过URL参数
http://localhost:8000/?debug=true

// 通过代码
window.AppConfig.set('app.debug', true);
window.AppConfig.debug(); // 打印配置信息
```

**后端：**
```bash
export APP_DEBUG=true
python script.py
```

### 查看配置信息

**前端：**
```javascript
console.log(window.AppConfig.getDebugInfo());
```

**后端：**
```python
from config import app_config
print(app_config.get_debug_info())
```

## 常见用例

### 1. 开发环境使用不同端口

```bash
export API_PORT=9000
```

或在URL中：
```
http://localhost:8000/?api_port=9000
```

### 2. 生产环境使用HTTPS

```bash
export API_PROTOCOL=https
export API_HOST=your-domain.com
export API_PORT=443
```

### 3. 测试环境使用不同数据库

```bash
export DB_PATH=test_database.db
```

### 4. 启用详细日志

```bash
export APP_DEBUG=true
export LOG_LEVEL=DEBUG
```

## 注意事项

1. **向后兼容**: 如果配置系统不可用，会自动回退到默认的localhost:8000
2. **安全性**: 不要在生产环境中启用调试模式
3. **性能**: 配置在应用启动时加载，运行时性能影响很小
4. **缓存**: 前端配置会缓存到localStorage，清除浏览器数据会重置配置

## 故障排除

### 配置不生效

1. 检查环境变量是否正确设置
2. 检查配置文件格式是否正确
3. 清除浏览器localStorage重试
4. 启用调试模式查看配置信息

### API连接失败

1. 确认API服务器正在运行
2. 检查端口号配置是否正确
3. 检查防火墙设置
4. 查看浏览器控制台错误信息