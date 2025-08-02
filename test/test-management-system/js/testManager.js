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
    if (window.testManager && typeof window.testManager.editTest === 'function') {
        window.testManager.editTest(testId);
    } else {
        console.warn('testManager.editTest function not yet loaded');
    }
};

window.viewDetails = function(testId) {
    if (window.testManager && typeof window.testManager.viewDetails === 'function') {
        window.testManager.viewDetails(testId);
    } else {
        console.warn('testManager.viewDetails function not yet loaded');
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
                    <button class="btn btn-success btn-sm" onclick="testManager.runSingleTest('${testCase.id}')">执行测试</button>
                    <button class="btn btn-primary btn-sm" onclick="testManager.editTest('${testCase.id}')">编辑</button>
                    <button class="btn btn-secondary btn-sm" onclick="testManager.viewDetails('${testCase.id}')">详情</button>
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

    // 获取当前选中的模块
    getCurrentModule() {
        let currentModule = 'all';
        try {
            // 尝试从页面标题获取当前模块
            const titleElement = document.getElementById('current-module-title');
            if (titleElement) {
                const title = titleElement.textContent;
                if (title !== '所有测试用例') {
                    Object.keys(this.moduleConfigs).forEach(moduleId => {
                        if (title.includes(this.moduleConfigs[moduleId].moduleName)) {
                            currentModule = moduleId;
                        }
                    });
                }
            }
        } catch (e) {
            console.log('无法获取当前模块状态，使用默认值');
        }
        return currentModule;
    }

    // 设置事件监听器
    setupEventListeners() {
        // 状态筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTestCases(this.getCurrentModule());
            });
        });

        // 分类筛选
        const categorySelect = document.getElementById('category-filter');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.renderTestCases(this.getCurrentModule());
            });
        }

        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderTestCases(this.getCurrentModule());
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
    async markTestPassed(testId) {
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        try {
            // 准备API请求数据
            const updateData = {
                title: testCase.title,
                description: testCase.description,
                module_id: testCase.module_id || testCase.moduleId || testCase.module,
                priority: testCase.priority,
                status: 'passed',
                estimated_time: testCase.estimated_time || '',
                expected_result: testCase.expected || testCase.expectedResult || '',
                actual_result: testCase.actualResult || '',
                executed_by: '手动测试'
            };

            // 调用API更新数据库
            const response = await fetch(`/api/test-cases/${testCase.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新失败');
            }

            // 更新前端数据
            testCase.status = 'passed';
            testCase.testResult = '✅ 测试通过';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();

        } catch (error) {
            console.error('标记测试通过失败:', error);
            alert(`操作失败: ${error.message}`);
        }
    }

    // 标记测试失败
    async markTestFailed(testId) {
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        try {
            // 准备API请求数据
            const updateData = {
                title: testCase.title,
                description: testCase.description,
                module_id: testCase.module_id || testCase.moduleId || testCase.module,
                priority: testCase.priority,
                status: 'failed',
                estimated_time: testCase.estimated_time || '',
                expected_result: testCase.expected || testCase.expectedResult || '',
                actual_result: testCase.actualResult || '',
                executed_by: '手动测试'
            };

            // 调用API更新数据库
            const response = await fetch(`/api/test-cases/${testCase.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新失败');
            }

            // 更新前端数据
            testCase.status = 'failed';
            testCase.testResult = '❌ 测试失败';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();

        } catch (error) {
            console.error('标记测试失败失败:', error);
            alert(`操作失败: ${error.message}`);
        }
    }

    // 标记测试待定
    async markTestPending(testId) {
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        try {
            // 准备API请求数据
            const updateData = {
                title: testCase.title,
                description: testCase.description,
                module_id: testCase.module_id || testCase.moduleId || testCase.module,
                priority: testCase.priority,
                status: 'pending',
                estimated_time: testCase.estimated_time || '',
                expected_result: testCase.expected || testCase.expectedResult || '',
                actual_result: '', // 重置实际结果
                executed_by: ''
            };

            // 调用API更新数据库
            const response = await fetch(`/api/test-cases/${testCase.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新失败');
            }

            // 更新前端数据
            testCase.status = 'pending';
            delete testCase.testResult;
            delete testCase.testDate;
            delete testCase.executedBy;
            testCase.actualResult = ''; // 重置实际结果
            
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();

        } catch (error) {
            console.error('标记测试待定失败:', error);
            alert(`操作失败: ${error.message}`);
        }
    }

    // 执行单个测试
    async runSingleTest(testId) {
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        try {
            // 准备API请求数据
            const updateData = {
                title: testCase.title,
                description: testCase.description,
                module_id: testCase.module_id || testCase.moduleId || testCase.module,
                priority: testCase.priority,
                status: 'passed',
                estimated_time: testCase.estimated_time || '',
                expected_result: testCase.expected || testCase.expectedResult || '',
                actual_result: testCase.actualResult || '',
                executed_by: '自动测试'
            };

            // 调用API更新数据库
            const response = await fetch(`/api/test-cases/${testCase.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新失败');
            }

            // 更新前端数据
            testCase.status = 'passed';
            testCase.testResult = '✅ 测试通过';
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '自动测试';
            
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();

        } catch (error) {
            console.error('执行测试失败:', error);
            alert(`操作失败: ${error.message}`);
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
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();
            alert('所有测试用例执行完成！');
        }
    }

    // 编辑测试用例
    editTest(testId) {
        // 使用宽松比较来处理字符串和数字类型的 ID
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        this.showEditModal(testCase);
    }

    // 显示编辑模态框
    showEditModal(testCase) {
        // 移除已存在的模态框
        const existingModal = document.getElementById('edit-test-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'edit-test-modal';
        modal.className = 'modal show';

        // 处理测试步骤
        const stepsText = Array.isArray(testCase.steps) ? testCase.steps.join('\n') : '';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>编辑测试用例</h2>
                    <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="edit-test-form">
                        <div class="form-group">
                            <label for="edit-test-id">测试用例ID:</label>
                            <input type="text" id="edit-test-id" value="${testCase.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-title">标题:</label>
                            <input type="text" id="edit-test-title" value="${testCase.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-description">描述:</label>
                            <textarea id="edit-test-description" rows="3" required>${testCase.description}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-steps">测试步骤 (每行一个步骤):</label>
                            <textarea id="edit-test-steps" rows="5" required>${stepsText}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-expected">预期结果:</label>
                            <textarea id="edit-test-expected" rows="3" required>${testCase.expected || testCase.expectedResult || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-actual">实际结果:</label>
                            <textarea id="edit-test-actual" rows="3" placeholder="请输入实际测试结果...">${testCase.actualResult || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-priority">优先级:</label>
                            <select id="edit-test-priority" required>
                                <option value="high" ${testCase.priority === 'high' ? 'selected' : ''}>高</option>
                                <option value="medium" ${testCase.priority === 'medium' ? 'selected' : ''}>中</option>
                                <option value="low" ${testCase.priority === 'low' ? 'selected' : ''}>低</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-test-status">状态:</label>
                            <select id="edit-test-status" required>
                                <option value="pending" ${testCase.status === 'pending' ? 'selected' : ''}>待测试</option>
                                <option value="passed" ${testCase.status === 'passed' ? 'selected' : ''}>已通过</option>
                                <option value="failed" ${testCase.status === 'failed' ? 'selected' : ''}>已失败</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="testManager.saveTestCase('${testCase.id}')">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 按 Esc 键关闭
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // 保存测试用例
    async saveTestCase(testId) {
        // 使用宽松比较来处理字符串和数字类型的 ID
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        // 获取表单数据
        const title = document.getElementById('edit-test-title').value.trim();
        const description = document.getElementById('edit-test-description').value.trim();
        const stepsText = document.getElementById('edit-test-steps').value.trim();
        const expected = document.getElementById('edit-test-expected').value.trim();
        const actualResult = document.getElementById('edit-test-actual').value.trim();
        const priority = document.getElementById('edit-test-priority').value;
        const status = document.getElementById('edit-test-status').value;

        // 验证必填字段
        if (!title || !description || !stepsText || !expected) {
            alert('请填写所有必填字段');
            return;
        }

        // 保存原有的执行信息
        const originalTestDate = testCase.testDate;
        const originalExecutedBy = testCase.executedBy;
        const originalTestResult = testCase.testResult;

        // 准备API请求数据
        const updateData = {
            title: title,
            description: description,
            module_id: testCase.module_id || testCase.moduleId || testCase.module,
            priority: priority,
            status: status,
            estimated_time: testCase.estimated_time || '',
            expected_result: expected,
            actual_result: actualResult,
            executed_by: ''
        };

        // 如果状态改变，更新相关信息
        if (status === 'passed') {
            // 如果之前没有执行时间，则设置为当前时间；否则保留原有时间
            if (!originalTestDate) {
                updateData.executed_by = '手动测试';
            } else {
                updateData.executed_by = originalExecutedBy || '手动测试';
            }
        } else if (status === 'failed') {
            // 如果之前没有执行时间，则设置为当前时间；否则保留原有时间
            if (!originalTestDate) {
                updateData.executed_by = '手动测试';
            } else {
                updateData.executed_by = originalExecutedBy || '手动测试';
            }
        } else if (status === 'pending') {
            updateData.executed_by = '';
        }

        try {
            // 调用API更新数据库
            const response = await fetch(`/api/test-cases/${testCase.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '保存失败');
            }

            const result = await response.json();
            console.log('测试用例保存成功:', result);

            // 更新前端数据
            testCase.title = title;
            testCase.description = description;
            testCase.steps = stepsText.split('\n').filter(step => step.trim() !== '');
            testCase.expected = expected;
            testCase.expectedResult = expected; // 兼容性
            testCase.actualResult = actualResult;
            testCase.priority = priority;
            testCase.status = status;

            // 如果状态改变，更新相关信息
            if (status === 'passed') {
                testCase.testResult = '✅ 手动标记为通过';
                // 如果之前没有执行时间，则设置为当前时间；否则保留原有时间
                if (!originalTestDate) {
                    testCase.testDate = new Date().toLocaleDateString('zh-CN');
                    testCase.executedBy = '手动测试';
                } else {
                    testCase.testDate = originalTestDate;
                    testCase.executedBy = originalExecutedBy || '手动测试';
                }
            } else if (status === 'failed') {
                testCase.testResult = '❌ 手动标记为失败';
                // 如果之前没有执行时间，则设置为当前时间；否则保留原有时间
                if (!originalTestDate) {
                    testCase.testDate = new Date().toLocaleDateString('zh-CN');
                    testCase.executedBy = '手动测试';
                } else {
                    testCase.testDate = originalTestDate;
                    testCase.executedBy = originalExecutedBy || '手动测试';
                }
            } else if (status === 'pending') {
                delete testCase.testResult;
                delete testCase.testDate;
                delete testCase.executedBy;
            }

            // 关闭模态框
            document.getElementById('edit-test-modal').remove();

            // 重新渲染测试用例，保持当前模块状态
            this.renderTestCases(this.getCurrentModule());
            this.updateStats();

            alert('测试用例保存成功！');

        } catch (error) {
            console.error('保存测试用例失败:', error);
            alert(`保存失败: ${error.message}`);
        }
    }

    // 查看测试用例详情
    viewDetails(testId) {
        // 使用宽松比较来处理字符串和数字类型的 ID
        const testCase = this.allTestCases.find(tc => tc.id == testId);
        if (!testCase) {
            alert('未找到该测试用例');
            return;
        }

        this.showDetailsModal(testCase);
    }

    // 显示详情模态框
    showDetailsModal(testCase) {
        // 移除已存在的模态框
        const existingModal = document.getElementById('test-details-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'test-details-modal';
        modal.className = 'modal show';

        const stepsHtml = Array.isArray(testCase.steps) ? 
            testCase.steps.map(step => `<li>${step}</li>`).join('') : 
            '<li>无测试步骤</li>';

        const statusText = {
            'pending': '待测试',
            'passed': '已通过', 
            'failed': '已失败'
        };

        const priorityText = {
            'high': '高优先级',
            'medium': '中优先级',
            'low': '低优先级'
        };

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>测试用例详情</h2>
                    <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="detail-section">
                        <h3>基本信息</h3>
                        <p><strong>ID:</strong> ${testCase.id}</p>
                        <p><strong>标题:</strong> ${testCase.title}</p>
                        <p><strong>状态:</strong> <span class="status-${testCase.status}">${statusText[testCase.status] || testCase.status}</span></p>
                        <p><strong>优先级:</strong> <span class="priority-${testCase.priority}">${priorityText[testCase.priority] || testCase.priority}</span></p>
                    </div>
                    <div class="detail-section">
                        <h3>描述</h3>
                        <p>${testCase.description}</p>
                    </div>
                    <div class="detail-section">
                        <h3>测试步骤</h3>
                        <ol>${stepsHtml}</ol>
                    </div>
                    <div class="detail-section">
                        <h3>预期结果</h3>
                        <p>${testCase.expected || testCase.expectedResult || '未定义'}</p>
                    </div>
                    ${testCase.actualResult ? `
                        <div class="detail-section">
                            <h3>实际结果</h3>
                            <p>${testCase.actualResult}</p>
                        </div>
                    ` : ''}
                    ${testCase.testDate ? `
                        <div class="detail-section">
                            <h3>执行信息</h3>
                            <p><strong>测试日期:</strong> ${testCase.testDate}</p>
                            <p><strong>执行者:</strong> ${testCase.executedBy || '未知'}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="testManager.editTest('${testCase.id}'); this.closest('.modal').remove()">编辑</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 按 Esc 键关闭
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
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