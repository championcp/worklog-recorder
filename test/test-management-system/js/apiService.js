// API服务类 - 连接后端数据库
class ApiService {
    constructor() {
        // 使用配置管理器获取API基础URL
        this.baseUrl = window.AppConfig ? window.AppConfig.getApiBaseUrl() : 'http://localhost:8000/api';
        this.headers = {
            'Content-Type': 'application/json'
        };
        
        // 在调试模式下输出API配置信息
        if (window.AppConfig && window.AppConfig.get('app.debug')) {
            console.log('🔗 ApiService initialized with baseUrl:', this.baseUrl);
        }
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 测试模块相关API
    async getModules() {
        return this.request('/test-cases/modules');
    }

    async createModule(moduleData) {
        return this.request('/test-cases/modules', {
            method: 'POST',
            body: JSON.stringify(moduleData)
        });
    }

    async updateModule(moduleId, moduleData) {
        return this.request(`/test-cases/modules/${moduleId}`, {
            method: 'PUT',
            body: JSON.stringify(moduleData)
        });
    }

    async deleteModule(moduleId) {
        return this.request(`/test-cases/modules/${moduleId}`, {
            method: 'DELETE'
        });
    }

    // 测试用例相关API
    async getTestCases(moduleId = null) {
        const endpoint = moduleId ? `/test-cases?moduleId=${moduleId}` : '/test-cases';
        return this.request(endpoint);
    }

    async getTestCase(testCaseId) {
        return this.request(`/test-cases/${testCaseId}`);
    }

    async createTestCase(testCaseData) {
        return this.request('/test-cases', {
            method: 'POST',
            body: JSON.stringify(testCaseData)
        });
    }

    async updateTestCase(testCaseId, testCaseData) {
        return this.request(`/test-cases/${testCaseId}`, {
            method: 'PUT',
            body: JSON.stringify(testCaseData)
        });
    }

    async deleteTestCase(testCaseId) {
        return this.request(`/test-cases/${testCaseId}`, {
            method: 'DELETE'
        });
    }

    // 测试步骤相关API
    async getTestSteps(testCaseId) {
        return this.request(`/test-cases/${testCaseId}/steps`);
    }

    async createTestStep(testCaseId, stepData) {
        return this.request(`/test-cases/${testCaseId}/steps`, {
            method: 'POST',
            body: JSON.stringify(stepData)
        });
    }

    async updateTestStep(testCaseId, stepId, stepData) {
        return this.request(`/test-cases/${testCaseId}/steps/${stepId}`, {
            method: 'PUT',
            body: JSON.stringify(stepData)
        });
    }

    async deleteTestStep(testCaseId, stepId) {
        return this.request(`/test-cases/${testCaseId}/steps/${stepId}`, {
            method: 'DELETE'
        });
    }

    // 测试结果相关API
    async getTestResults(testCaseId) {
        return this.request(`/test-cases/${testCaseId}/results`);
    }

    async createTestResult(testCaseId, resultData) {
        return this.request(`/test-cases/${testCaseId}/results`, {
            method: 'POST',
            body: JSON.stringify(resultData)
        });
    }

    // 统计数据API
    async getStatistics() {
        return this.request('/test-cases/statistics');
    }

    // 执行测试用例
    async executeTestCase(testCaseId, actualResult, status) {
        const resultData = {
            actual_result: actualResult,
            status: status,
            executed_at: new Date().toISOString(),
            executed_by: '手动测试'
        };

        // 创建测试结果记录
        await this.createTestResult(testCaseId, resultData);

        // 更新测试用例状态
        return this.updateTestCase(testCaseId, { status });
    }
}

// 创建全局API服务实例
window.apiService = new ApiService();

// 数据转换工具
class DataTransformer {
    // 将后端模块数据转换为前端格式
    static transformModule(backendModule) {
        return {
            id: backendModule.id,
            name: backendModule.name,
            description: backendModule.description,
            color: backendModule.color || '#3498db',
            moduleName: backendModule.name // 保持向后兼容
        };
    }

    // 将后端测试用例数据转换为前端格式
    static transformTestCase(backendTestCase) {
        return {
            id: backendTestCase.id,
            title: backendTestCase.title,
            description: backendTestCase.description,
            module: backendTestCase.module_id,
            category: backendTestCase.module_id, // 保持向后兼容
            priority: backendTestCase.priority,
            status: backendTestCase.status,
            estimatedTime: backendTestCase.estimated_time,
            steps: backendTestCase.steps || [],
            expectedResult: backendTestCase.expected_result,
            actualResult: backendTestCase.actual_result,
            testDate: backendTestCase.updated_at ? new Date(backendTestCase.updated_at).toLocaleDateString('zh-CN') : null,
            executedBy: backendTestCase.executed_by || '手动测试'
        };
    }

    // 将前端测试用例数据转换为后端格式
    static transformTestCaseForBackend(frontendTestCase) {
        return {
            title: frontendTestCase.title,
            description: frontendTestCase.description,
            module_id: frontendTestCase.module || frontendTestCase.category,
            priority: frontendTestCase.priority,
            status: frontendTestCase.status,
            estimated_time: frontendTestCase.estimatedTime,
            expected_result: frontendTestCase.expectedResult,
            actual_result: frontendTestCase.actualResult,
            executed_by: frontendTestCase.executedBy
        };
    }

    // 将前端模块数据转换为后端格式
    static transformModuleForBackend(frontendModule) {
        return {
            name: frontendModule.name || frontendModule.moduleName,
            description: frontendModule.description,
            color: frontendModule.color
        };
    }
}

window.DataTransformer = DataTransformer;