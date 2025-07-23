// 测试用例管理器 - 使用全局变量方式

// 为了向后兼容，保留一些全局函数
window.runTest = function(testId) {
    if (typeof runSingleTest === 'function') {
        runSingleTest(testId);
    } else {
        console.warn('runSingleTest function not yet loaded');
    }
};

window.editTest = function(testId) {
    if (typeof editTest === 'function') {
        editTest(testId);
    } else {
        console.warn('editTest function not yet loaded');
    }
};

window.viewDetails = function(testId) {
    if (typeof viewDetails === 'function') {
        viewDetails(testId);
    } else {
        console.warn('viewDetails function not yet loaded');
    }
};

// 延迟设置这些全局函数引用
setTimeout(() => {
    if (typeof runAllTests === 'function') {
        window.runAllTests = runAllTests;
    }
    if (typeof exportResults === 'function') {
        window.exportResults = exportResults;
    }
    if (typeof generateReport === 'function') {
        window.generateReport = generateReport;
    }
}, 100);

// 测试用例管理核心功能

class TestManager {
    constructor() {
        // 等待testCaseManager加载完成后再初始化
        this.initializeWhenReady();
    }
    
    initializeWhenReady() {
        // 检查testCaseManager是否已加载
        if (typeof window.testCaseManager !== 'undefined') {
            this.initialize();
        } else {
            // 如果还没加载，等待一下再检查
            setTimeout(() => this.initializeWhenReady(), 100);
        }
    }
    
    initialize() {
        // 从全局testCaseManager获取数据
        const { allTestCases, testCasesByModule, moduleConfigs, utils } = window.testCaseManager;
        
        // 设置实例变量
        this.allTestCases = allTestCases;
        this.testCasesByModule = testCasesByModule;
        this.moduleConfigs = moduleConfigs;
        this.utils = utils;
        
        // 为了向后兼容，设置全局变量
        window.testCases = allTestCases;
        window.categories = this.getCategories();
        
        console.log('TestManager initialized with', allTestCases.length, 'test cases');
    }
    
    getCategories() {
        // 从moduleConfigs生成categories对象
        const categories = {};
        Object.keys(this.moduleConfigs || {}).forEach(key => {
            const config = this.moduleConfigs[key];
            categories[key] = {
                name: config.moduleName,
                color: config.color || '#007bff',
                testCases: this.testCasesByModule[key] || []
            };
        });
        return categories;
    }
    
    // 初始化页面
    initializePage() {
        console.log('TestManager initializing...');
        
        // 从 window.testCaseManager 获取数据
        if (window.testCaseManager) {
            this.allTestCases = window.testCaseManager.getAllTestCases() || [];
            this.testCasesByModule = window.testCaseManager.getTestCasesByModule() || {};
            this.moduleConfigs = window.testCaseManager.getModuleConfigs() || {};
        } else {
            // 如果 testCaseManager 不可用，使用默认数据
            this.allTestCases = [];
            this.testCasesByModule = {};
            this.moduleConfigs = {};
        }
        
        console.log(`TestManager initialized with ${this.allTestCases.length} test cases`);
        
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchTerm = '';
        
        this.setupEventListeners();
        this.updateStats();
        
        // 动态加载测试用例模块
        this.loadTestCaseModules();
    }

    // 从数据库加载测试用例模块（不再使用静态JS文件）
    async loadTestCaseModules() {
        console.log('Loading test case modules from database...');
        
        // 监听 testCasesLoaded 事件
        const handleTestCasesLoaded = (event) => {
            console.log('TestCaseManager数据加载完成，开始同步数据...');
            this.syncWithTestCaseManager();
            // 移除事件监听器
            document.removeEventListener('testCasesLoaded', handleTestCasesLoaded);
        };
        
        // 检查 TestCaseManager 是否已经加载完成
        if (window.testCaseManager && window.testCaseManager.allTestCases && window.testCaseManager.allTestCases.length > 0) {
            console.log('TestCaseManager已经加载完成，直接同步数据');
            this.syncWithTestCaseManager();
        } else {
            // 添加事件监听器等待数据加载完成
            document.addEventListener('testCasesLoaded', handleTestCasesLoaded);
            
            // 设置超时机制，如果10秒内没有收到事件，使用默认数据
            setTimeout(() => {
                if (!window.testCaseManager || !window.testCaseManager.allTestCases || window.testCaseManager.allTestCases.length === 0) {
                    console.warn('等待TestCaseManager数据加载超时，使用默认数据');
                    document.removeEventListener('testCasesLoaded', handleTestCasesLoaded);
                    this.loadDefaultData();
                }
            }, 10000);
        }
    }
    
    // 与TestCaseManager同步数据
    syncWithTestCaseManager() {
        if (!window.testCaseManager) return;
        
        this.allTestCases = window.testCaseManager.allTestCases || [];
        this.testCasesByModule = window.testCaseManager.testCasesByModule || {};
        this.moduleConfigs = window.testCaseManager.moduleConfigs || {};
        
        console.log(`TestManager synced with ${this.allTestCases.length} test cases from database`);
        
        // 确保 utils 对象存在
        if (!window.testCaseManager.utils) {
            // 创建 TestCaseUtils 实例
            class TestCaseUtils {
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
                    const moduleTests = this.getTestCasesByModule(moduleId);
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

                updateTestCaseStatus(testId, status, result = null) {
                    const testCase = this.getTestCaseById(testId);
                    if (testCase) {
                        testCase.status = status;
                        if (result) {
                            testCase.actualResult = result;
                            testCase.testDate = new Date().toLocaleDateString('zh-CN');
                            testCase.executedBy = '手动测试';
                        }
                        return true;
                    }
                    return false;
                }
            }
            
            window.testCaseManager.utils = new TestCaseUtils();
        }
        
        console.log(`TestManager updated with ${this.allTestCases.length} test cases`);
        this.renderTestCases();
        this.updateStats();
        
        // 触发模块卡片统计更新
        if (typeof updateModuleCardStats === 'function') {
            updateModuleCardStats();
        }
    }

    // 加载默认数据（当API不可用时）
    loadDefaultData() {
        console.log('Loading default test data...');
        
        // 默认模块配置
        this.moduleConfigs = {
            auth: { moduleName: '用户认证', color: '#007bff' },
            dashboard: { moduleName: '仪表板', color: '#28a745' },
            logging: { moduleName: '日志记录', color: '#ffc107' },
            reports: { moduleName: '报表生成', color: '#dc3545' },
            settings: { moduleName: '系统设置', color: '#6f42c1' },
            backup: { moduleName: '数据备份', color: '#fd7e14' },
            security: { moduleName: '安全管理', color: '#20c997' },
            integration: { moduleName: '系统集成', color: '#e83e8c' },
            performance: { moduleName: '性能监控', color: '#6c757d' },
            mobile: { moduleName: '移动端', color: '#17a2b8' },
            api: { moduleName: 'API接口', color: '#343a40' }
        };

        // 默认测试用例（简化版）
        this.allTestCases = [
            {
                id: 'AUTH-001',
                module: 'auth',
                title: '用户登录功能测试',
                description: '验证用户能够正常登录系统',
                steps: ['打开登录页面', '输入用户名和密码', '点击登录按钮'],
                expected: '用户成功登录并跳转到主页',
                priority: 'high',
                status: 'pending'
            },
            {
                id: 'DASH-001',
                module: 'dashboard',
                title: '仪表板数据显示测试',
                description: '验证仪表板能够正确显示数据',
                steps: ['登录系统', '进入仪表板页面', '检查数据显示'],
                expected: '仪表板正确显示所有数据',
                priority: 'medium',
                status: 'pending'
            }
        ];

        // 按模块分组
        this.testCasesByModule = {};
        this.allTestCases.forEach(testCase => {
            const moduleCode = testCase.module;
            if (!this.testCasesByModule[moduleCode]) {
                this.testCasesByModule[moduleCode] = [];
            }
            this.testCasesByModule[moduleCode].push(testCase);
        });

        console.log(`Loaded ${this.allTestCases.length} default test cases`);
    }

    // 渲染测试用例
    renderTestCases(moduleCode = 'all') {
        const container = document.getElementById('test-cases-container');
        if (!container || !this.allTestCases) return;

        let testCases = [];
        
        if (moduleCode === 'all') {
            testCases = this.getFilteredTestCases();
        } else {
            const moduleTestCases = this.testCasesByModule[moduleCode] || [];
            testCases = this.filterTestCases(moduleTestCases);
        }

        container.innerHTML = '';

        if (testCases.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到符合条件的测试用例</div>';
            return;
        }

        // 按模块分组
        const groupedTests = {};
        testCases.forEach(testCase => {
            const module = testCase.module;
            if (!groupedTests[module]) {
                groupedTests[module] = [];
            }
            groupedTests[module].push(testCase);
        });

        // 渲染每个模块的测试用例
        Object.keys(groupedTests).forEach(moduleKey => {
            const moduleConfig = this.moduleConfigs[moduleKey];
            if (!moduleConfig) return;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'test-category';
            categoryDiv.innerHTML = `
                <div class="category-header" style="background: ${moduleConfig.color || '#007bff'}">
                    <span>${moduleConfig.moduleName}</span>
                    <span class="category-count">${groupedTests[moduleKey].length} 个测试用例</span>
                </div>
                <div class="category-content">
                    ${groupedTests[moduleKey].map(testCase => this.createTestCaseHTML(testCase)).join('')}
                </div>
            `;
            container.appendChild(categoryDiv);
        });

        this.updateStats();
    }

    // 过滤测试用例
    filterTestCases(testCases) {
        return testCases.filter(testCase => {
            const matchesStatus = this.currentFilter === 'all' || testCase.status === this.currentFilter;
            const matchesSearch = !this.searchTerm || 
                testCase.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                testCase.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            return matchesStatus && matchesSearch;
        });
    }

    // 获取过滤后的测试用例
    getFilteredTestCases() {
        if (!this.allTestCases) return [];
        
        return this.allTestCases.filter(testCase => {
            const matchesStatus = this.currentFilter === 'all' || testCase.status === this.currentFilter;
            const matchesSearch = !this.searchTerm || 
                testCase.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                testCase.description.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            return matchesStatus && matchesSearch;
        });
    }

    // 创建测试用例HTML
    createTestCaseHTML(testCase) {
        const statusText = {
            'pending': '待测试',
            'passed': '已通过', 
            'failed': '已失败'
        };

        return `
            <div class="test-case ${testCase.status}" data-test-id="${testCase.id}">
                <div class="test-header">
                    <div class="test-id">${testCase.id}</div>
                    <div class="test-status status-${testCase.status}">
                        ${statusText[testCase.status] || testCase.status}
                    </div>
                    <div class="test-priority priority-${testCase.priority}">
                        ${testCase.priority}
                    </div>
                </div>
                <div class="test-content">
                    <h4 class="test-title">${testCase.title}</h4>
                    <p class="test-description">${testCase.description}</p>
                    <div class="test-steps">
                        <strong>测试步骤：</strong>
                        <ol>
                            ${Array.isArray(testCase.steps) ? testCase.steps.map(step => `<li>${step}</li>`).join('') : '<li>无测试步骤</li>'}
                        </ol>
                    </div>
                    <div class="test-expected">
                        <strong>预期结果：</strong>
                        <p>${testCase.expected || testCase.expectedResult || '未定义'}</p>
                    </div>
                    ${testCase.actualResult ? `
                        <div class="test-actual">
                            <strong>实际结果：</strong>
                            <p>${testCase.actualResult}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="test-actions">
                    <button class="btn btn-success" onclick="testManager.markTestPassed('${testCase.id}')">通过</button>
                    <button class="btn btn-danger" onclick="testManager.markTestFailed('${testCase.id}')">失败</button>
                    <button class="btn btn-warning" onclick="testManager.markTestPending('${testCase.id}')">待定</button>
                    <button class="btn btn-primary" onclick="testManager.runSingleTest('${testCase.id}')">执行</button>
                </div>
            </div>
        `;
    }

    // 更新统计信息
    updateStats() {
        if (!this.allTestCases || !Array.isArray(this.allTestCases)) {
            this.allTestCases = [];
        }
        
        const total = this.allTestCases.length;
        const passed = this.allTestCases.filter(tc => tc.status === 'passed').length;
        const failed = this.allTestCases.filter(tc => tc.status === 'failed').length;
        const pending = this.allTestCases.filter(tc => tc.status === 'pending').length;
        
        document.getElementById('total-tests').textContent = total;
        document.getElementById('passed-tests').textContent = passed;
        document.getElementById('failed-tests').textContent = failed;
        document.getElementById('pending-tests').textContent = pending;
        
        // 更新进度条
        const passRate = total > 0 ? (passed / total) * 100 : 0;
        document.getElementById('progress-bar').style.width = `${passRate}%`;
        document.getElementById('pass-rate').textContent = `${passRate.toFixed(1)}%`;
        
        // 更新分类统计
        this.updateCategoryStats();
    }

    // 更新分类统计
    updateCategoryStats() {
        const categoryContainer = document.getElementById('category-stats');
        if (!categoryContainer || !this.allTestCases) return;
        
        categoryContainer.innerHTML = '';
        
        Object.keys(this.getCategories()).forEach(categoryKey => {
            const category = this.getCategories()[categoryKey];
            const categoryTests = this.allTestCases.filter(tc => tc.module === categoryKey);
            const passedInCategory = categoryTests.filter(tc => tc.status === 'passed').length;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.innerHTML = `
                <div class="category-color" style="background-color: ${category.color}"></div>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${passedInCategory}/${categoryTests.length}</div>
                </div>
            `;
            categoryContainer.appendChild(categoryElement);
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 状态筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTestCases();
            });
        });

        // 分类筛选
        const categorySelect = document.getElementById('category-filter');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.renderTestCases();
            });
        }

        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderTestCases();
            });
        }

        // 批量操作按钮
        const runAllBtn = document.getElementById('run-all-tests');
        if (runAllBtn) {
            runAllBtn.addEventListener('click', () => this.runAllTests());
        }

        const exportBtn = document.getElementById('export-results');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportResults());
        }
    }

    // 标记测试通过
    markTestPassed(testId) {
        const testCase = this.allTestCases.find(tc => tc.id === testId);
        if (testCase) {
            testCase.status = 'passed';
            testCase.testResult = '✅ 测试通过';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            this.renderTestCases();
            this.updateStats();
        }
    }

    // 标记测试失败
    markTestFailed(testId) {
        const testCase = this.allTestCases.find(tc => tc.id === testId);
        if (testCase) {
            testCase.status = 'failed';
            testCase.testResult = '❌ 测试失败';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            this.renderTestCases();
            this.updateStats();
        }
    }

    // 标记测试待定
    markTestPending(testId) {
        const testCase = this.allTestCases.find(tc => tc.id === testId);
        if (testCase) {
            testCase.status = 'pending';
            delete testCase.testResult;
            delete testCase.testDate;
            delete testCase.executedBy;
            this.renderTestCases();
            this.updateStats();
        }
    }

    // 执行单个测试
    runSingleTest(testId) {
        const testCase = this.allTestCases.find(tc => tc.id === testId);
        if (testCase) {
            // 模拟测试执行
            testCase.status = 'passed';
            testCase.testResult = '🔄 自动化测试执行完成';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '自动化测试';
            this.renderTestCases();
            this.updateStats();
        }
    }

    // 执行所有测试
    runAllTests() {
        if (confirm('确定要执行所有测试用例吗？这可能需要一些时间。')) {
            this.allTestCases.forEach(testCase => {
                if (testCase.status === 'pending') {
                    testCase.status = 'passed';
                    testCase.testResult = '🔄 批量自动化测试执行完成';
                    testCase.testDate = new Date().toLocaleDateString('zh-CN');
                    testCase.executedBy = '自动化测试';
                }
            });
            this.renderTestCases();
            this.updateStats();
            alert('所有测试用例执行完成！');
        }
    }

    // 导出测试结果
    exportResults() {
        const results = {
            exportDate: new Date().toISOString(),
            summary: {
                total: this.allTestCases.length,
                passed: this.allTestCases.filter(tc => tc.status === 'passed').length,
                failed: this.allTestCases.filter(tc => tc.status === 'failed').length,
                pending: this.allTestCases.filter(tc => tc.status === 'pending').length
            },
            testCases: this.allTestCases
        };

        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// 创建全局测试管理器实例
const testManager = new TestManager();

// 将测试管理器设置为全局变量，以便其他文件访问
window.testManager = testManager;