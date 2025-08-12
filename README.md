# 工作日志记录软件

一个帮助你记录工作日常、提升计划性的个人生产力工具。

## 功能特性

- 📅 多时间维度计划管理（天/周/月/年）
- ⏱️ 实时记录计划完成情况
- 📝 自定义计划和记录模板
- 📊 时间统计和分析
- 🏷️ 工作分类和标签管理
- 📈 时间线和甘特图展示
- 🔔 任务提醒和通知
- 🔐 用户认证和数据保护

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **认证**: JWT

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 项目结构

```
nobody-logger/
├── client/                    # React前端应用
├── server/                    # Node.js后端API
├── shared/                    # 共享类型定义
├── test/                      # 测试相关文件
│   ├── test-management-system/ # 测试用例管理系统
│   │   ├── index.html         # 测试管理界面
│   │   ├── css/               # 测试界面样式
│   │   ├── js/                # 测试管理逻辑
│   │   └── testCases/         # 各模块测试用例
│   ├── coverage/              # 代码覆盖率报告
│   ├── api_tests.test.js      # API测试
│   └── setup.js               # 测试环境配置
└── docs/                      # 文档
```

## 使用说明

1. 注册账号并登录
2. 创建工作分类和标签
3. 制定日/周/月/年计划
4. 实时记录任务完成情况
5. 查看统计报表和图表分析

## 测试

项目包含完整的测试套件，用于确保代码质量和功能正确性：

### 测试用例管理系统
- 位置：`test/test-management-system/`
- 功能：提供Web界面管理和执行测试用例
- 使用：在浏览器中打开 `test/test-management-system/index.html`

### API测试
- 位置：`test/api_tests.test.js`
- 功能：测试后端API接口

### 代码覆盖率
- 位置：`test/coverage/`
- 功能：查看代码覆盖率报告

### 运行测试
```bash
# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage
```

## 许可证

MIT License