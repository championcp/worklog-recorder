// 测试用例数据和分类定义

// 确保DataTransformer可用
if (typeof window.DataTransformer === 'undefined') {
    console.warn('DataTransformer未定义，将使用默认转换器');
    window.DataTransformer = {
        transformModule: (module) => ({
            moduleName: module.name || module.moduleName,
            color: module.color || '#3498db'
        }),
        transformTestCase: (testCase) => ({
            id: testCase.id,
            title: testCase.title || testCase.name,
            description: testCase.description,
            module: testCase.module_id || testCase.module,
            priority: testCase.priority || 'medium',
            status: testCase.status || 'pending',
            steps: testCase.steps || [],
            expectedResult: testCase.expected_result || testCase.expected,
            actualResult: testCase.actual_result,
            testDate: testCase.test_date,
            executedBy: testCase.executed_by
        }),
        transformTestCaseForBackend: (testCase) => ({
            title: testCase.title,
            description: testCase.description,
            module_id: testCase.module,
            priority: testCase.priority,
            status: testCase.status,
            steps: testCase.steps,
            expected_result: testCase.expectedResult
        })
    };
}

// 动态加载测试用例模块
// 避免重复声明
if (typeof window.TestCaseManager === 'undefined') {
    window.TestCaseManager = class TestCaseManager {
    constructor() {
        this.allTestCases = [];
        this.testCasesByModule = {};
        this.moduleConfigs = {};
        this.utils = null; // 将在onLoadComplete中初始化
        this.loadTestCases();
    }

    async loadTestCases() {
        try {
            console.log('TestCaseManager 初始化开始，从API加载数据...');
            
            // 检查API服务是否可用
            if (typeof window.apiService === 'undefined') {
                console.warn('API服务不可用，使用默认数据');
                this.loadDefaultData();
                return;
            }

            // 从API加载模块和测试用例数据
            await this.loadFromAPI();
        } catch (error) {
            console.error('从API加载数据失败，使用默认数据:', error);
            this.loadDefaultData();
        }
    }

    async loadFromAPI() {
        try {
            // 加载模块数据
            const modulesResponse = await window.apiService.getModules();
            const modules = modulesResponse.data || [];
            
            // 加载测试用例数据
            const testCasesResponse = await window.apiService.getTestCases();
            const testCases = testCasesResponse.data || [];

            // 转换模块数据
            this.moduleConfigs = {};
            modules.forEach(module => {
                const transformedModule = window.DataTransformer.transformModule(module);
                this.moduleConfigs[module.id] = transformedModule;
            });

            // 转换测试用例数据
            this.allTestCases = testCases.map(testCase => 
                window.DataTransformer.transformTestCase(testCase)
            );

            // 按模块分组测试用例
            this.testCasesByModule = {};
            this.allTestCases.forEach(testCase => {
                const moduleId = testCase.module;
                if (!this.testCasesByModule[moduleId]) {
                    this.testCasesByModule[moduleId] = [];
                }
                this.testCasesByModule[moduleId].push(testCase);
            });

            console.log('从API加载数据成功:', {
                modules: modules.length,
                testCases: testCases.length
            });

            this.onLoadComplete();
        } catch (error) {
            console.error('API加载失败:', error);
            throw error;
        }
    }

    loadModule(moduleName, testCases, moduleConfig) {
        try {
            // 为每个测试用例添加模块信息
            testCases.forEach(testCase => {
                testCase.module = moduleName;
            });
            
            // 存储测试用例和配置
            this.testCasesByModule[moduleName] = testCases;
            this.moduleConfigs[moduleName] = moduleConfig;
            this.allTestCases.push(...testCases);
            
            console.log(`模块 ${moduleName} 加载完成:`, testCases.length, '个测试用例');
            
            // 检查是否所有模块都已加载
            const expectedModules = ['auth', 'dashboard', 'task', 'category', 'tag', 'plan', 'time', 'log', 'statistics', 'report', 'settings'];
            const loadedModules = Object.keys(this.moduleConfigs);
            
            if (loadedModules.length >= expectedModules.length) {
                this.onLoadComplete();
            }
        } catch (error) {
            console.error(`加载模块 ${moduleName} 失败:`, error);
        }
    }

    loadDefaultData() {
        // 如果动态加载失败，使用默认的测试数据
        console.log('使用默认测试数据');
        
        // 定义默认的模块配置
        const defaultModuleConfigs = {
            auth: { moduleName: '用户认证', color: '#3498db' },
            dashboard: { moduleName: '仪表板', color: '#2ecc71' },
            task: { moduleName: '任务管理', color: '#e74c3c' },
            category: { moduleName: '分类管理', color: '#f39c12' },
            tag: { moduleName: '标签管理', color: '#9b59b6' },
            plan: { moduleName: '计划管理', color: '#1abc9c' },
            time: { moduleName: '时间记录', color: '#34495e' },
            log: { moduleName: '工作日志', color: '#e67e22' },
            statistics: { moduleName: '统计分析', color: '#c0392b' },
            report: { moduleName: '报告管理', color: '#a18cd1' },
            settings: { moduleName: '设置', color: '#16a085' }
        };
        
        // 定义默认的测试用例数据
        const defaultTestCases = [
            {
                id: 'TC001',
                title: '用户登录功能测试',
                description: '测试用户使用正确的用户名和密码登录系统',
                category: 'auth',
                module: 'auth',
                priority: 'high',
                status: 'pending',
                estimatedTime: '15分钟',
                steps: [
                    '打开登录页面',
                    '输入正确的用户名',
                    '输入正确的密码',
                    '点击登录按钮'
                ],
                expectedResult: '用户成功登录，跳转到主页面'
            },
            {
                id: 'TC002',
                title: '用户注册功能测试',
                description: '测试新用户注册账号功能',
                category: 'auth',
                module: 'auth',
                priority: 'high',
                status: 'pending',
                estimatedTime: '20分钟',
                steps: [
                    '打开注册页面',
                    '输入用户名',
                    '输入邮箱',
                    '输入密码',
                    '确认密码',
                    '点击注册按钮'
                ],
                expectedResult: '用户成功注册，收到确认邮件'
            }
        ];
        
        // 设置默认数据
        this.moduleConfigs = defaultModuleConfigs;
        this.allTestCases = defaultTestCases;
        this.testCasesByModule = {
            auth: defaultTestCases
        };
        
        this.onLoadComplete();
    }

    onLoadComplete() {
        // 初始化utils工具类
        this.utils = new window.TestCaseUtils();
        
        // 设置全局变量以保持向后兼容
        window.testCaseManager = this;
        
        // 触发自定义事件
        const event = new CustomEvent('testCasesLoaded', {
            detail: {
                totalTestCases: this.allTestCases.length,
                modules: Object.keys(this.moduleConfigs)
            }
        });
        document.dispatchEvent(event);
    }

    // 获取所有测试用例
    getAllTestCases() {
        return this.allTestCases;
    }

    // 获取按模块分组的测试用例
    getTestCasesByModule() {
        return this.testCasesByModule;
    }

    // 获取模块配置
    getModuleConfigs() {
        return this.moduleConfigs;
    }
    }
}

// 测试用例工具类
// 避免重复声明
if (typeof window.TestCaseUtils === 'undefined') {
    window.TestCaseUtils = class TestCaseUtils {
    getTestCasesByModule(moduleId) {
        if (!window.testCaseManager) return [];
        return window.testCaseManager.testCasesByModule[moduleId] || [];
    }

    getOverallStats() {
        if (!window.testCaseManager) return { total: 0, passed: 0, failed: 0, pending: 0 };
        
        const allTests = window.testCaseManager.allTestCases;
        const stats = {
            total: allTests.length,
            passed: allTests.filter(t => t.status === 'passed').length,
            failed: allTests.filter(t => t.status === 'failed').length,
            pending: allTests.filter(t => t.status === 'pending').length
        };
        
        return stats;
    }

    getModuleStats(moduleId) {
        // 如果传入的是模块名称（字符串），需要找到对应的数字ID
        let actualModuleId = moduleId;
        
        // 检查是否需要进行名称到ID的映射
        if (window.testCaseManager && window.testCaseManager.moduleConfigs) {
            const moduleConfigs = window.testCaseManager.moduleConfigs;
            const testCasesByModule = window.testCaseManager.testCasesByModule;
            
            // 如果传入的moduleId在testCasesByModule中不存在，尝试查找映射
            if (!testCasesByModule[moduleId]) {
                // 创建模块名称到ID的映射
                const nameToIdMap = {};
                
                // 默认的模块名称映射
                const defaultNameMap = {
                    'auth': '用户认证',
                    'dashboard': '仪表板', 
                    'task': '任务管理',
                    'category': '分类管理',
                    'tag': '标签管理',
                    'plan': '计划管理',
                    'time': '时间记录',
                    'log': '工作日志',
                    'statistics': '统计分析',
                    'report': '报告管理',
                    'settings': '设置',
                    'template': '模板管理'
                };
                
                // 遍历moduleConfigs，建立名称到ID的映射
                Object.keys(moduleConfigs).forEach(id => {
                    const config = moduleConfigs[id];
                    if (config && config.moduleName) {
                        // 通过模块名称映射
                        Object.keys(defaultNameMap).forEach(key => {
                            if (defaultNameMap[key] === config.moduleName) {
                                nameToIdMap[key] = id;
                            }
                        });
                    }
                });
                
                // 如果找到了映射，使用映射后的ID
                if (nameToIdMap[moduleId]) {
                    actualModuleId = nameToIdMap[moduleId];
                }
            }
        }
        
        const moduleTests = this.getTestCasesByModule(actualModuleId);
        if (moduleTests.length === 0) return null;
        
        return {
            total: moduleTests.length,
            passed: moduleTests.filter(t => t.status === 'passed').length,
            failed: moduleTests.filter(t => t.status === 'failed').length,
            pending: moduleTests.filter(t => t.status === 'pending').length
        };
    }

    getTestCaseById(testId) {
        if (!window.testCaseManager) return null;
        return window.testCaseManager.allTestCases.find(t => t.id === testId);
    }

    async updateTestCaseStatus(testId, status, result = null) {
        const testCase = this.getTestCaseById(testId);
        if (!testCase) {
            return false;
        }

        try {
            // 更新本地数据
            testCase.status = status;
            if (result) {
                testCase.actualResult = result;
                testCase.testDate = new Date().toLocaleDateString('zh-CN');
                testCase.executedBy = '手动测试';
            }

            // 如果API服务可用，同步到后端
            if (typeof window.apiService !== 'undefined') {
                await window.apiService.executeTestCase(testId, result, status);
                console.log(`测试用例 ${testId} 状态已同步到数据库`);
            } else {
                console.warn('API服务不可用，仅更新本地状态');
            }

            return true;
        } catch (error) {
            console.error('更新测试用例状态失败:', error);
            // 即使API调用失败，也保持本地更新
            return true;
        }
    }

    // 添加新的测试用例
    async addTestCase(testCaseData) {
        try {
            if (typeof window.apiService !== 'undefined') {
                const backendData = window.DataTransformer.transformTestCaseForBackend(testCaseData);
                const response = await window.apiService.createTestCase(backendData);
                const newTestCase = window.DataTransformer.transformTestCase(response.data);
                
                // 更新本地数据
                this.allTestCases.push(newTestCase);
                const moduleId = newTestCase.module;
                if (!this.testCasesByModule[moduleId]) {
                    this.testCasesByModule[moduleId] = [];
                }
                this.testCasesByModule[moduleId].push(newTestCase);
                
                return newTestCase;
            } else {
                // 如果API不可用，只更新本地数据
                testCaseData.id = 'TC' + Date.now();
                this.allTestCases.push(testCaseData);
                const moduleId = testCaseData.module;
                if (!this.testCasesByModule[moduleId]) {
                    this.testCasesByModule[moduleId] = [];
                }
                this.testCasesByModule[moduleId].push(testCaseData);
                return testCaseData;
            }
        } catch (error) {
            console.error('添加测试用例失败:', error);
            throw error;
        }
    }

    // 删除测试用例
    async deleteTestCase(testId) {
        try {
            if (typeof window.apiService !== 'undefined') {
                await window.apiService.deleteTestCase(testId);
            }

            // 更新本地数据
            this.allTestCases = this.allTestCases.filter(tc => tc.id !== testId);
            Object.keys(this.testCasesByModule).forEach(moduleId => {
                this.testCasesByModule[moduleId] = this.testCasesByModule[moduleId].filter(tc => tc.id !== testId);
            });

            return true;
        } catch (error) {
            console.error('删除测试用例失败:', error);
            throw error;
        }
    }
    }
}

// 兼容性：保留旧的分类定义格式（避免重复声明）
if (typeof window.categories === 'undefined') {
    window.categories = {
        auth: { name: '用户认证', color: '#3498db' },
        dashboard: { name: '仪表板', color: '#2ecc71' },
        task: { name: '任务管理', color: '#e74c3c' },
        category: { name: '分类管理', color: '#f39c12' },
        tag: { name: '标签管理', color: '#9b59b6' },
        plan: { name: '计划管理', color: '#1abc9c' },
        time: { name: '时间记录', color: '#34495e' },
        log: { name: '工作日志', color: '#e67e22' },
        statistics: { name: '统计分析', color: '#c0392b' },
        report: { name: '报告管理', color: '#a18cd1' },
        settings: { name: '设置', color: '#16a085' },
        template: { name: '模板管理', color: '#8e44ad' }
    };
}

// 初始化测试用例管理器（避免重复创建）
document.addEventListener('DOMContentLoaded', function() {
    // 创建测试用例管理器实例
    if (typeof window.testCaseManager === 'undefined') {
        new window.TestCaseManager();
    }
});

// 监听测试用例加载完成事件
document.addEventListener('testCasesLoaded', function(event) {
    console.log('测试用例加载完成事件触发:', event.detail);
    
    // 更新页面统计信息
    if (typeof updateOverallStats === 'function') {
        updateOverallStats();
    }
    
    // 更新模块卡片统计
    if (typeof updateModuleCardStats === 'function') {
        updateModuleCardStats();
    }
});

// 导出数据供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { categories: window.categories };
}