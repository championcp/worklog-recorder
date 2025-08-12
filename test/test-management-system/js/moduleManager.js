/**
 * 动态模块管理器
 * 负责从API加载模块数据并动态渲染模块卡片
 */

class ModuleManager {
    constructor() {
        this.modules = [];
        // 使用配置管理器获取API基础URL
        this.apiBaseUrl = window.AppConfig ? window.AppConfig.getApiBaseUrl() : 'http://localhost:8000/api';
        this.moduleContainer = null;
        
        // 在调试模式下输出API配置信息
        if (window.AppConfig && window.AppConfig.get('app.debug')) {
            console.log('🔗 ModuleManager initialized with apiBaseUrl:', this.apiBaseUrl);
        }
    }

    /**
     * 初始化模块管理器
     */
    async init() {
        console.log('🚀 ModuleManager 初始化中...');
        
        // 查找模块容器
        this.moduleContainer = document.querySelector('#module-grid');
        if (!this.moduleContainer) {
            console.error('❌ 未找到模块容器 #module-grid');
            return;
        }

        try {
            // 从API加载模块数据
            await this.loadModulesFromAPI();
            
            // 渲染模块卡片
            this.renderModules();
            
            console.log(`✅ ModuleManager 初始化完成，加载了 ${this.modules.length} 个模块`);
        } catch (error) {
            console.error('❌ ModuleManager 初始化失败:', error);
            // 如果API加载失败，保持现有的硬编码模块
            console.log('📝 保持现有硬编码模块');
        }
    }

    /**
     * 从API加载模块统计数据
     */
    async loadModulesFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/modules/statistics`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                this.modules = result.data;
                console.log('📊 从API加载模块数据成功:', this.modules.length, '个模块');
            } else {
                throw new Error('API返回数据格式错误');
            }
        } catch (error) {
            console.error('❌ 从API加载模块数据失败:', error);
            throw error;
        }
    }

    /**
     * 渲染模块卡片
     */
    renderModules() {
        if (!this.moduleContainer || this.modules.length === 0) {
            return;
        }

        // 清空现有内容
        this.moduleContainer.innerHTML = '';

        // 为每个模块创建卡片
        this.modules.forEach(module => {
            const moduleCard = this.createModuleCard(module);
            this.moduleContainer.appendChild(moduleCard);
        });

        console.log(`🎨 渲染了 ${this.modules.length} 个模块卡片`);
    }

    /**
     * 创建单个模块卡片
     */
    createModuleCard(module) {
        const card = document.createElement('div');
        card.className = 'module-card';
        card.setAttribute('data-module', this.getModuleKey(module.name));

        // 获取状态样式
        const statusClass = this.getStatusClass(module);
        const statusText = this.getStatusText(module);

        card.innerHTML = `
            <div class="module-icon">
                <i class="${this.getModuleIcon(module)}"></i>
            </div>
            <div class="module-info">
                <h3>${module.name}</h3>
                <p>${module.description}</p>
                <div class="module-stats">
                    <span class="test-count">${module.total_cases} 个测试用例</span>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${module.pass_rate}%; background-color: ${module.color}"></div>
                </div>
                <div class="test-details">
                    <span class="passed">通过: ${module.passed_cases}</span>
                    <span class="failed">失败: ${module.failed_cases}</span>
                    <span class="pending">待测: ${module.pending_cases}</span>
                </div>
            </div>
        `;

        // 添加点击事件
        card.addEventListener('click', () => {
            this.handleModuleClick(module);
        });

        return card;
    }

    /**
     * 获取模块图标
     */
    getModuleIcon(module) {
        // 如果数据库中有图标信息，使用数据库的
        if (module.icon && module.icon !== 'fas fa-cube') {
            return module.icon;
        }

        // 否则根据模块名称映射图标
        const iconMap = {
            '用户认证': 'fas fa-lock',
            '仪表板': 'fas fa-tachometer-alt',
            '任务管理': 'fas fa-tasks',
            '分类管理': 'fas fa-folder',
            '标签管理': 'fas fa-tags',
            '计划管理': 'fas fa-calendar',
            '时间记录': 'fas fa-clock',
            '工作日志': 'fas fa-book',
            '统计分析': 'fas fa-chart-bar',
            '报告管理': 'fas fa-file-alt',
            '设置': 'fas fa-cog',
            '模板管理': 'fas fa-file-code'
        };

        return iconMap[module.name] || 'fas fa-cube';
    }

    /**
     * 获取模块键名（用于data-module属性）
     */
    getModuleKey(moduleName) {
        const keyMap = {
            '用户认证': 'auth',
            '仪表板': 'dashboard',
            '任务管理': 'task',
            '分类管理': 'category',
            '标签管理': 'tag',
            '计划管理': 'plan',
            '时间记录': 'time',
            '工作日志': 'log',
            '统计分析': 'statistics',
            '报告管理': 'report',
            '设置': 'settings',
            '模板管理': 'template'
        };

        return keyMap[moduleName] || moduleName.toLowerCase();
    }

    /**
     * 获取状态样式类
     */
    getStatusClass(module) {
        if (module.total_cases === 0) return 'inactive';
        if (module.pass_rate >= 80) return 'good';
        if (module.pass_rate >= 60) return 'warning';
        if (module.failed_cases > 0) return 'error';
        return 'pending';
    }

    /**
     * 获取状态文本
     */
    getStatusText(module) {
        if (module.total_cases === 0) return '无测试';
        if (module.pass_rate >= 80) return '良好';
        if (module.pass_rate >= 60) return '一般';
        if (module.failed_cases > 0) return '有问题';
        return '待测试';
    }

    /**
     * 处理模块点击事件
     */
    handleModuleClick(module) {
        console.log('🖱️ 点击模块:', module.name, 'ID:', module.id);
        
        // 触发自定义事件
        const event = new CustomEvent('moduleSelected', {
            detail: {
                module: module,
                moduleKey: this.getModuleKey(module.name)
            }
        });
        document.dispatchEvent(event);

        // 调用showModuleTests函数显示该模块的测试用例
        // 传递模块的数据库ID，这样API可以正确过滤测试用例
        if (typeof window.showModuleTests === 'function') {
            window.showModuleTests(module.id);
        } else {
            console.warn('showModuleTests function not found');
        }

        // 如果存在全局的模块选择处理函数，调用它
        if (typeof window.selectModule === 'function') {
            window.selectModule(this.getModuleKey(module.name));
        }
    }

    /**
     * 刷新模块数据
     */
    async refresh() {
        console.log('🔄 刷新模块数据...');
        try {
            await this.loadModulesFromAPI();
            this.renderModules();
            console.log('✅ 模块数据刷新完成');
        } catch (error) {
            console.error('❌ 刷新模块数据失败:', error);
        }
    }

    /**
     * 获取模块数据
     */
    getModules() {
        return this.modules;
    }

    /**
     * 根据ID获取模块
     */
    getModuleById(id) {
        return this.modules.find(module => module.id === id);
    }

    /**
     * 根据名称获取模块
     */
    getModuleByName(name) {
        return this.modules.find(module => module.name === name);
    }
}

// 创建全局实例
window.moduleManager = new ModuleManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.moduleManager.init();
});

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleManager;
}