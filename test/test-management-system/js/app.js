// 应用程序入口文件

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查缓存管理器是否可用
    if (typeof window.cacheManager !== 'undefined') {
        console.log('缓存管理器已初始化');
        // 检查数据更新
        window.cacheManager.checkDataUpdate();
    }
    
    // 初始化模块管理器
    initializeModuleManager();
    
    // 初始化测试管理器
    if (typeof window.testManager !== 'undefined') {
        window.testManager.initializePage();
    }
    
    // 添加页面交互增强
    addPageEnhancements();
    
    // 添加数据变化监听器
    setupDataChangeListener();
});

// 初始化模块管理器
async function initializeModuleManager() {
    try {
        // 创建模块管理器实例
        window.moduleManager = new ModuleManager();
        
        // 初始化模块管理器
        await window.moduleManager.init();
        
        // 初始化模块导航事件
        initializeModuleNavigation();
        
        // 更新统计数据
        updateOverallStats();
        
    } catch (error) {
        console.error('模块管理器初始化失败:', error);
        showModuleLoadError();
    }
}

// 显示模块加载错误
function showModuleLoadError() {
    const moduleGrid = document.getElementById('module-grid');
    if (moduleGrid) {
        moduleGrid.innerHTML = `
            <div class="error-placeholder">
                <div class="error-icon">⚠️</div>
                <h3>模块加载失败</h3>
                <p>无法从服务器加载模块数据，请检查API服务器是否正常运行。</p>
                <button class="retry-button" onclick="initializeModuleManager()">重试</button>
            </div>
        `;
    }
}

// 设置数据变化监听器
function setupDataChangeListener() {
    // 监听测试数据变化
    const originalUpdateStats = updateOverallStats;
    window.updateOverallStats = function() {
        originalUpdateStats();
        
        // 数据更新时通知缓存管理器
        if (typeof window.cacheManager !== 'undefined') {
            localStorage.setItem('last_data_update', new Date().getTime().toString());
        }
    };
}

// 初始化模块导航
function initializeModuleNavigation() {
    // 注意：模块卡片的点击事件已经在moduleManager.js中处理
    // 这里不需要重复添加事件监听器，避免冲突
    
    // 添加快速操作按钮事件
    const viewAllBtn = document.getElementById('view-all-tests');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => showAllTests());
    }
    
    const runAllBtn = document.getElementById('run-all-tests');
    if (runAllBtn) {
        runAllBtn.addEventListener('click', () => runAllTests());
    }
    
    const exportBtn = document.getElementById('export-results');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportResults());
    }
    
    const generateReportBtn = document.getElementById('generate-report');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => generateReport());
    }
    
    // 返回模块导航按钮
    const backBtn = document.getElementById('back-to-modules');
    if (backBtn) {
        backBtn.addEventListener('click', () => showModuleNavigation());
    }
}

// 显示指定模块的测试用例
function showModuleTests(moduleId) {
    const moduleNavigation = document.querySelector('.module-navigation');
    const dashboard = document.querySelector('.dashboard');
    const progressSection = document.querySelector('.progress-section');
    const quickActions = document.querySelector('.quick-actions');
    const testCasesView = document.getElementById('test-cases-view');
    const moduleTitle = document.getElementById('current-module-title');
    
    // 隐藏模块导航和仪表盘
    moduleNavigation.style.display = 'none';
    dashboard.style.display = 'none';
    progressSection.style.display = 'none';
    quickActions.style.display = 'none';
    
    // 显示测试用例视图
    testCasesView.style.display = 'block';
    
    // 更新标题 - 如果是数字ID，则从API获取模块名称
    if (moduleId === 'all') {
        moduleTitle.textContent = '所有测试用例';
    } else {
        // 对于数字ID，我们将在renderTestCases中获取模块名称并更新标题
        moduleTitle.textContent = '测试用例';
    }
    
    // 渲染测试用例
    renderTestCases(moduleId);
    
    // 初始化筛选功能
    initializeFilters(moduleId);
}

// 显示所有测试用例
function showAllTests() {
    showModuleTests('all');
    document.getElementById('current-module-title').textContent = '所有测试用例';
}

// 显示模块导航
function showModuleNavigation() {
    const moduleNavigation = document.querySelector('.module-navigation');
    const dashboard = document.querySelector('.dashboard');
    const progressSection = document.querySelector('.progress-section');
    const quickActions = document.querySelector('.quick-actions');
    const testCasesView = document.getElementById('test-cases-view');
    
    // 显示模块导航和仪表盘
    moduleNavigation.style.display = 'block';
    dashboard.style.display = 'grid';
    progressSection.style.display = 'block';
    quickActions.style.display = 'block';
    
    // 隐藏测试用例视图
    testCasesView.style.display = 'none';
    
    // 更新统计数据
    updateOverallStats();
}

// 渲染测试用例
async function renderTestCases(moduleId = 'all') {
    const container = document.getElementById('test-cases-container');
    if (!container) return;
    
    container.innerHTML = '<p class="loading">正在加载测试用例...</p>';
    
    try {
        let testCases = [];
        
        if (moduleId === 'all') {
            // 获取所有测试用例
            const apiUrl = window.AppConfig ? window.AppConfig.getApiUrl('/test-cases') : 'http://localhost:8000/api/test-cases';
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.success) {
                testCases = data.data;
            }
        } else {
            // 获取特定模块的测试用例
            const apiUrl = window.AppConfig ? 
                window.AppConfig.getApiUrl(`/test-cases?moduleId=${moduleId}`) : 
                `http://localhost:8000/api/test-cases?moduleId=${moduleId}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.success) {
                testCases = data.data;
                // 更新页面标题为模块名称
                if (testCases.length > 0) {
                    const moduleTitle = document.getElementById('current-module-title');
                    if (moduleTitle) {
                        moduleTitle.textContent = testCases[0].module_name + ' - 测试用例';
                    }
                }
            }
        }
        
        container.innerHTML = '';
        
        if (testCases.length === 0) {
            container.innerHTML = '<p class="no-tests">暂无测试用例</p>';
            return;
        }
        
        // 按模块分组显示
        const groupedTests = {};
        testCases.forEach(testCase => {
            const moduleName = testCase.module_name || '未知模块';
            if (!groupedTests[moduleName]) {
                groupedTests[moduleName] = [];
            }
            groupedTests[moduleName].push(testCase);
        });
        
        Object.keys(groupedTests).forEach(moduleName => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'test-category';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'category-header';
            headerDiv.style.background = '#3498db'; // 默认颜色
            headerDiv.innerHTML = `
                <span>${moduleName}</span>
                <span class="category-count">${groupedTests[moduleName].length} 个测试用例</span>
            `;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'category-content';
            
            groupedTests[moduleName].forEach(testCase => {
                const testCaseDiv = createTestCaseElement(testCase);
                contentDiv.appendChild(testCaseDiv);
            });
            
            categoryDiv.appendChild(headerDiv);
            categoryDiv.appendChild(contentDiv);
            container.appendChild(categoryDiv);
        });
        
    } catch (error) {
        console.error('加载测试用例失败:', error);
        container.innerHTML = '<p class="error">加载测试用例失败，请稍后重试</p>';
    }
}

// 创建测试用例元素
function createTestCaseElement(testCase) {
    const div = document.createElement('div');
    div.className = `test-case ${testCase.status}`;
    
    // 处理测试步骤 - API返回的是数组格式
    const steps = testCase.steps || [];
    const stepsHtml = Array.isArray(steps) ? 
        steps.map(step => `<li>${step}</li>`).join('') : 
        '<li>无测试步骤</li>';
    
    // 处理标题
    const title = testCase.title || '未定义标题';
    
    // 处理预期结果
    const expectedResult = testCase.expected_result || testCase.expected || '未定义';
    
    // 处理实际结果
    const actualResult = testCase.actual_result || testCase.actualResult || '';
    
    // 处理执行者
    const executedBy = testCase.executed_by || testCase.executedBy || '';
    
    // 处理测试时间
    const estimatedTime = testCase.estimated_time || testCase.estimatedTime || '未设置';
    
    div.innerHTML = `
        <div class="test-header">
            <div class="test-id">${testCase.id}</div>
            <div class="test-status status-${testCase.status}">
                ${testCase.status === 'pending' ? '待测试' : 
                  testCase.status === 'passed' ? '已通过' : '已失败'}
            </div>
            <div class="test-priority priority-${testCase.priority}">
                ${testCase.priority === 'high' ? '高' : 
                  testCase.priority === 'medium' ? '中' : '低'}
            </div>
        </div>
        <div class="test-description">
            <strong class="test-case-title">${title}</strong><br>
            ${testCase.description || '无描述'}
        </div>
        <div class="test-case-content" style="display: block;">
            <div class="test-meta">
                <span class="estimated-time">预计时间: ${estimatedTime}</span>
            </div>
            <div class="test-steps">
                <h4>测试步骤：</h4>
                <ol>
                    ${stepsHtml}
                </ol>
            </div>
            <div class="test-expected">
                <h4>预期结果：</h4>
                <p>${expectedResult}</p>
            </div>
            ${actualResult ? `
                <div class="test-result">
                    <h4>实际结果：</h4>
                    <p>${actualResult}</p>
                    ${executedBy ? `<p>执行者: ${executedBy}</p>` : ''}
                </div>
            ` : ''}
            <div class="test-actions">
                <button class="btn btn-success btn-sm" onclick="runSingleTest('${testCase.id}')">执行测试</button>
                <button class="btn btn-primary btn-sm" onclick="editTest('${testCase.id}')">编辑</button>
                <button class="btn btn-secondary btn-sm" onclick="viewDetails('${testCase.id}')">详情</button>
            </div>
        </div>
    `;
    return div;
}

// 初始化筛选功能
function initializeFilters(moduleId) {
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const searchInput = document.getElementById('search-input');
    
    // 重置筛选器
    if (statusFilter) statusFilter.value = 'all';
    if (priorityFilter) priorityFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => applyFilters(moduleId));
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', () => applyFilters(moduleId));
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', window.Utils.debounce(() => applyFilters(moduleId), 300));
    }
}

// 应用筛选
async function applyFilters(moduleId) {
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const searchInput = document.getElementById('search-input');
    
    const filters = {
        status: statusFilter ? statusFilter.value : 'all',
        priority: priorityFilter ? priorityFilter.value : 'all',
        search: searchInput ? searchInput.value.toLowerCase() : ''
    };
    
    // 重新从API获取测试用例数据
    let testCases = [];
    try {
        if (moduleId === 'all') {
            const response = await fetch('/api/test-cases');
            const data = await response.json();
            if (data.success) {
                testCases = data.data;
            }
        } else {
            const response = await fetch(`/api/test-cases?moduleId=${moduleId}`);
            const data = await response.json();
            if (data.success) {
                testCases = data.data;
            }
        }
    } catch (error) {
        console.error('获取测试用例失败:', error);
        return;
    }
    
    // 应用筛选条件
    const filteredTests = testCases.filter(testCase => {
        const statusMatch = filters.status === 'all' || testCase.status === filters.status;
        const priorityMatch = filters.priority === 'all' || testCase.priority === filters.priority;
        const searchMatch = filters.search === '' || 
            testCase.title.toLowerCase().includes(filters.search) ||
            testCase.description.toLowerCase().includes(filters.search);
        
        return statusMatch && priorityMatch && searchMatch;
    });
    
    // 重新渲染筛选后的测试用例
    renderFilteredTestCases(filteredTests);
}

// 渲染筛选后的测试用例
function renderFilteredTestCases(testCases) {
    const container = document.getElementById('test-cases-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (testCases.length === 0) {
        container.innerHTML = '<p class="no-tests">没有找到匹配的测试用例</p>';
        return;
    }
    
    // 按模块分组显示
    const groupedTests = {};
    testCases.forEach(testCase => {
        const moduleName = testCase.module_name || '未知模块';
        if (!groupedTests[moduleName]) {
            groupedTests[moduleName] = [];
        }
        groupedTests[moduleName].push(testCase);
    });
    
    Object.keys(groupedTests).forEach(moduleName => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'test-category';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';
        headerDiv.style.background = '#3498db'; // 默认颜色
        headerDiv.innerHTML = `
            <span>${moduleName}</span>
            <span class="category-count">${groupedTests[moduleName].length} 个测试用例</span>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content';
        
        groupedTests[moduleName].forEach(testCase => {
            const testCaseDiv = createTestCaseElement(testCase);
            contentDiv.appendChild(testCaseDiv);
        });
        
        categoryDiv.appendChild(headerDiv);
        categoryDiv.appendChild(contentDiv);
        container.appendChild(categoryDiv);
    });
}

// 更新总体统计数据
function updateOverallStats() {
    // 优先使用模块管理器的数据
    if (typeof window.moduleManager !== 'undefined' && window.moduleManager.modules) {
        updateStatsFromModuleManager();
    } else if (typeof window.testCaseManager !== 'undefined') {
        updateStatsFromTestCaseManager();
    }
}

// 从模块管理器更新统计数据
function updateStatsFromModuleManager() {
    const modules = window.moduleManager.modules;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let pendingTests = 0;
    
    modules.forEach(module => {
        totalTests += module.total_cases || 0;
        passedTests += module.passed_cases || 0;
        failedTests += module.failed_cases || 0;
        pendingTests += module.pending_cases || 0;
    });
    
    // 更新统计卡片
    const totalElement = document.getElementById('total-tests');
    const passedElement = document.getElementById('passed-tests');
    const failedElement = document.getElementById('failed-tests');
    const pendingElement = document.getElementById('pending-tests');
    const passRateElement = document.getElementById('pass-rate');
    const progressBar = document.getElementById('progress-bar');
    
    if (totalElement) totalElement.textContent = totalTests;
    if (passedElement) passedElement.textContent = passedTests;
    if (failedElement) failedElement.textContent = failedTests;
    if (pendingElement) pendingElement.textContent = pendingTests;
    
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    if (passRateElement) passRateElement.textContent = passRate + '%';
    if (progressBar) progressBar.style.width = passRate + '%';
}

// 从测试用例管理器更新统计数据（备用方案）
function updateStatsFromTestCaseManager() {
    const stats = window.testCaseManager.utils.getOverallStats();
    
    // 更新统计卡片
    const totalElement = document.getElementById('total-tests');
    const passedElement = document.getElementById('passed-tests');
    const failedElement = document.getElementById('failed-tests');
    const pendingElement = document.getElementById('pending-tests');
    const passRateElement = document.getElementById('pass-rate');
    const progressBar = document.getElementById('progress-bar');
    
    if (totalElement) totalElement.textContent = stats.total;
    if (passedElement) passedElement.textContent = stats.passed;
    if (failedElement) failedElement.textContent = stats.failed;
    if (pendingElement) pendingElement.textContent = stats.pending;
    
    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
    if (passRateElement) passRateElement.textContent = passRate + '%';
    if (progressBar) progressBar.style.width = passRate + '%';
    
    // 更新模块卡片状态
    updateModuleCardStats();
}

// 更新模块卡片统计
function updateModuleCardStats() {
    if (typeof window.testCaseManager === 'undefined') return;
    
    document.querySelectorAll('.module-card').forEach(card => {
        const moduleId = card.dataset.module;
        const stats = window.testCaseManager.utils.getModuleStats(moduleId);
        
        if (stats) {
            // 更新测试用例数量
            const testCountElement = card.querySelector('.test-count');
            if (testCountElement) {
                testCountElement.textContent = `${stats.total}个测试用例`;
            }
            
            // 更新状态指示器
            const statusIndicator = card.querySelector('.status-indicator');
            if (statusIndicator) {
                if (stats.passed === stats.total && stats.total > 0) {
                    // 所有测试都通过
                    statusIndicator.className = 'status-indicator passed';
                    statusIndicator.textContent = '已完成';
                } else if (stats.failed > 0) {
                    // 有失败的测试
                    statusIndicator.className = 'status-indicator failed';
                    statusIndicator.textContent = '有失败';
                } else if (stats.passed > 0 && stats.pending > 0) {
                    // 部分测试通过，部分待测试
                    statusIndicator.className = 'status-indicator partial';
                    statusIndicator.textContent = '进行中';
                } else if (stats.total > 0) {
                    // 全部待测试
                    statusIndicator.className = 'status-indicator pending';
                    statusIndicator.textContent = '待测试';
                } else {
                    // 无测试用例
                    statusIndicator.className = 'status-indicator empty';
                    statusIndicator.textContent = '无数据';
                }
            }
        } else {
            // 如果没有统计数据，显示0个测试用例
            const testCountElement = card.querySelector('.test-count');
            if (testCountElement) {
                testCountElement.textContent = '0个测试用例';
            }
            
            const statusIndicator = card.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator pending';
                statusIndicator.textContent = '无数据';
            }
        }
    });
}

// 将 updateModuleCardStats 函数暴露到全局作用域
window.updateModuleCardStats = updateModuleCardStats;

// 执行所有测试
function runAllTests() {
    if (typeof window.testCaseManager === 'undefined') {
        Utils.showNotification('测试管理器未初始化', 'error');
        return;
    }
    
    Utils.showNotification('开始执行所有测试用例...', 'info');
    
    // 模拟批量测试执行
    setTimeout(() => {
        const allTests = window.testCaseManager.allTestCases;
        let passedCount = 0;
        
        allTests.forEach(testCase => {
            // 模拟测试执行结果
            const success = Math.random() > 0.2; // 80% 成功率
            if (success) {
                testCase.status = 'passed';
                testCase.testResult = `测试通过 - ${testCase.title}功能正常`;
                testCase.testDate = new Date().toLocaleDateString('zh-CN');
                testCase.executedBy = '自动化测试';
                passedCount++;
            } else {
                testCase.status = 'failed';
                testCase.testResult = `测试失败 - ${testCase.title}功能异常`;
                testCase.testDate = new Date().toLocaleDateString('zh-CN');
                testCase.executedBy = '自动化测试';
            }
        });
        
        // 通知缓存管理器数据已更新
        if (typeof window.cacheManager !== 'undefined') {
            localStorage.setItem('last_data_update', new Date().getTime().toString());
            console.log('批量测试数据已更新，缓存时间戳已刷新');
        }
        
        updateOverallStats();
        Utils.showNotification(`批量测试完成！通过 ${passedCount}/${allTests.length} 个测试用例`, 'success');
    }, 2000);
}

// 导出测试结果
function exportResults() {
    if (typeof window.testCaseManager === 'undefined') {
        Utils.showNotification('测试管理器未初始化', 'error');
        return;
    }
    
    const allTests = window.testCaseManager.allTestCases;
    const stats = window.testCaseManager.utils.getOverallStats();
    
    const exportData = {
        exportDate: new Date().toISOString(),
        summary: stats,
        testCases: allTests
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Utils.showNotification('测试结果已导出', 'success');
}

// 生成测试报告
function generateReport() {
    if (typeof window.testCaseManager === 'undefined') {
        Utils.showNotification('测试管理器未初始化', 'error');
        return;
    }
    
    const stats = window.testCaseManager.utils.getOverallStats();
    const moduleStats = {};
    
    Object.keys(window.testCaseManager.moduleConfigs).forEach(moduleId => {
        moduleStats[moduleId] = window.testCaseManager.utils.getModuleStats(moduleId);
    });
    
    const reportContent = `
# 测试报告

## 总体统计
- 总测试用例: ${stats.total}
- 已通过: ${stats.passed}
- 已失败: ${stats.failed}
- 待测试: ${stats.pending}
- 通过率: ${((stats.passed / stats.total) * 100).toFixed(1)}%

## 模块统计
${Object.keys(moduleStats).map(moduleId => {
    const config = window.testCaseManager.moduleConfigs[moduleId];
    const stat = moduleStats[moduleId];
    return `### ${config.moduleName}
- 测试用例: ${stat.total}
- 已通过: ${stat.passed}
- 已失败: ${stat.failed}
- 待测试: ${stat.pending}`;
}).join('\n\n')}

---
报告生成时间: ${new Date().toLocaleString('zh-CN')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Utils.showNotification('测试报告已生成', 'success');
}

// 执行单个测试
function runSingleTest(testId) {
    if (typeof window.testCaseManager === 'undefined') {
        Utils.showNotification('测试管理器未初始化', 'error');
        return;
    }
    
    const testCase = window.testCaseManager.utils.getTestCaseById(testId);
    if (!testCase) {
        Utils.showNotification('测试用例不存在', 'error');
        return;
    }
    
    Utils.showNotification(`正在执行测试: ${testCase.title}`, 'info');
    
    // 模拟测试执行
    setTimeout(() => {
        const success = Math.random() > 0.3; // 70% 成功率
        
        if (success) {
            testCase.status = 'passed';
            testCase.testResult = `测试通过 - ${testCase.title}功能正常`;
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            Utils.showNotification(`测试通过: ${testCase.title}`, 'success');
        } else {
            testCase.status = 'failed';
            testCase.testResult = `测试失败 - ${testCase.title}功能异常`;
            testCase.testDate = new Date().toLocaleDateString('zh-CN');
            testCase.executedBy = '手动测试';
            Utils.showNotification(`测试失败: ${testCase.title}`, 'error');
        }
        
        // 通知缓存管理器数据已更新
        if (typeof window.cacheManager !== 'undefined') {
            localStorage.setItem('last_data_update', new Date().getTime().toString());
            console.log('测试数据已更新，缓存时间戳已刷新');
        }
        
        // 重新渲染当前视图
        const currentView = document.getElementById('test-cases-view').style.display;
        if (currentView !== 'none') {
            const moduleCards = document.querySelectorAll('.module-card');
            let currentModule = 'all';
            
            // 检查当前显示的模块
            const title = document.getElementById('current-module-title').textContent;
            if (title !== '所有测试用例') {
                Object.keys(window.testCaseManager.moduleConfigs).forEach(moduleId => {
                    if (title.includes(window.testCaseManager.moduleConfigs[moduleId].moduleName)) {
                        currentModule = moduleId;
                    }
                });
            }
            
            renderTestCases(currentModule);
        }
        
        updateOverallStats();
    }, 1500);
}

// 编辑测试用例
function editTest(testId) {
    Utils.showNotification('编辑功能开发中...', 'info');
}

// 查看测试详情
function viewDetails(testId) {
    // 确保 testCaseManager 和 utils 可用
    if (window.testCaseManager && typeof window.testCaseManager.utils.getTestCaseById === 'function') {
        const testCase = window.testCaseManager.utils.getTestCaseById(testId);
        if (testCase) {
            // 创建并显示模态框
            createAndShowDetailsModal(testCase);
        } else {
            console.error(`未找到ID为 ${testId} 的测试用例`);
            Utils.showNotification('未找到该测试用例', 'error');
        }
    } else {
        console.error('TestCaseManager 或其 utils 尚未初始化');
        Utils.showNotification('系统正在初始化，请稍后再试', 'info');
    }
}

// 创建并显示测试详情模态框
function createAndShowDetailsModal(testCase) {
    // 移除已存在的模态框
    const existingModal = document.getElementById('test-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建模态框元素
    const modal = document.createElement('div');
    modal.id = 'test-details-modal';
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => modal.style.display = 'none';

    const stepsHtml = Array.isArray(testCase.steps) ? 
        testCase.steps.map(step => `<li>${step}</li>`).join('') : 
        '<li>无测试步骤</li>';

    modalContent.innerHTML = `
        <h2>${testCase.title}</h2>
        <p><strong>ID:</strong> ${testCase.id}</p>
        <p><strong>状态:</strong> ${testCase.status}</p>
        <p><strong>优先级:</strong> ${testCase.priority}</p>
        <p><strong>描述:</strong> ${testCase.description}</p>
        <div><strong>测试步骤:</strong><ol>${stepsHtml}</ol></div>
        <p><strong>预期结果:</strong> ${testCase.expected || testCase.expectedResult}</p>
        ${testCase.actualResult ? `<p><strong>实际结果:</strong> ${testCase.actualResult}</p>` : ''}
        ${testCase.testDate ? `<p><strong>测试日期:</strong> ${testCase.testDate}</p>` : ''}
        ${testCase.executedBy ? `<p><strong>执行者:</strong> ${testCase.executedBy}</p>` : ''}
    `;

    modalContent.insertBefore(closeBtn, modalContent.firstChild);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 显示模态框
    modal.style.display = 'block';

    // 点击模态框外部关闭
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            modal.remove(); // 关闭时也从DOM中移除
        }
    }

    // 按 Esc 键关闭
    const escapeHandler = function(event) {
        if (event.key === 'Escape') {
            modal.style.display = 'none';
            modal.remove();
            document.removeEventListener('keydown', escapeHandler); // 移除监听器
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// 添加页面交互增强
function addPageEnhancements() {
    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F: 聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + E: 导出结果
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            testManager.exportResults();
        }
        
        // Ctrl/Cmd + R: 执行所有测试
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            testManager.runAllTests();
        }
    });
    
    // 添加工具提示
    addTooltips();
    
    // 添加平滑滚动
    addSmoothScrolling();
    
    // 添加测试用例展开/折叠功能
    addTestCaseToggle();
}

// 添加工具提示
function addTooltips() {
    const tooltipElements = [
        { selector: '#run-all-tests', text: '执行所有待测试用例 (Ctrl+R)' },
        { selector: '#export-results', text: '导出测试结果为JSON文件 (Ctrl+E)' },
        { selector: '#search-input', text: '搜索测试用例 (Ctrl+F)' }
    ];
    
    tooltipElements.forEach(({ selector, text }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.title = text;
        }
    });
}

// 添加平滑滚动
function addSmoothScrolling() {
    // 为所有内部链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 添加测试用例展开/折叠功能
function addTestCaseToggle() {
    // 为测试用例标题添加点击展开/折叠功能
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('test-case-title')) {
            const testCase = e.target.closest('.test-case');
            const content = testCase.querySelector('.test-case-content');
            
            const style = window.getComputedStyle(content);
            
            if (style.display === 'none') {
                content.style.display = 'block';
                e.target.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                e.target.classList.add('collapsed');
            }
        }
    });
}

// 实用工具函数
// 避免重复声明
if (typeof window.Utils === 'undefined') {
    window.Utils = {
    // 格式化日期
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 生成唯一ID
    generateId() {
        return 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // 深拷贝对象
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // 显示通知消息
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    };
}

// 添加CSS动画
if (!document.querySelector('#app-styles')) {
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .modal {
            display: none; 
            position: fixed; 
            z-index: 1001; 
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto; 
            background-color: rgba(0,0,0,0.4);
        }
        .modal-content {
            background-color: #fefefe;
            margin: 10% auto; 
            padding: 20px;
            border: 1px solid #888;
            width: 60%; 
            border-radius: 5px;
        }
        .close-btn {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
        }
        .close-btn:hover,
        .close-btn:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }
    `;
    document.head.appendChild(modalStyle);

    const appStyle = document.createElement('style');
    appStyle.id = 'app-styles';
    appStyle.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .test-case-title.collapsed::after {
            content: ' [已折叠]';
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .test-case-title {
            cursor: pointer;
            user-select: none;
        }
        
        .test-case-title:hover {
            color: #3498db;
        }
    `;
    document.head.appendChild(appStyle);
}

// 将关键函数暴露到全局作用域，供HTML onclick事件使用
window.runSingleTest = runSingleTest;
window.editTest = editTest;
window.viewDetails = viewDetails;
window.showModuleTests = showModuleTests;
window.showModuleNavigation = showModuleNavigation;

// 导出工具函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils: window.Utils, runSingleTest, editTest, viewDetails };
}