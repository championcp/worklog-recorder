#!/bin/bash

# Sprint 5 测试执行脚本
# Nobody Logger - 数据分析与团队协作系统

echo "🚀 开始执行 Sprint 5 测试套件..."

# 设置测试环境变量
export NODE_ENV=test
export CI=true

# 创建测试结果目录
mkdir -p coverage
mkdir -p test-results

echo "📋 运行单元测试..."

# 运行单元测试并生成覆盖率报告
npm test -- \
  --coverage \
  --coverageDirectory=coverage \
  --coverageReporters=text,lcov,html,json \
  --testPathPattern="src/.*\.test\.(ts|tsx)$" \
  --collectCoverageFrom="src/**/*.{ts,tsx}" \
  --collectCoverageFrom="!src/**/*.d.ts" \
  --collectCoverageFrom="!src/**/*.stories.{ts,tsx}" \
  --collectCoverageFrom="!src/index.tsx" \
  --collectCoverageFrom="!src/serviceWorker.ts" \
  --watchAll=false \
  --verbose

echo "📊 运行集成测试..."

# 运行集成测试
npm test -- \
  --testPathPattern="tests/integration/.*\.test\.(ts|tsx)$" \
  --watchAll=false \
  --verbose

echo "🔍 生成测试报告..."

# 生成 JSON 格式的测试结果
npm test -- \
  --outputFile=test-results/test-results.json \
  --json \
  --watchAll=false \
  --silent \
  --passWithNoTests

echo "✅ Sprint 5 测试完成！"

# 显示覆盖率摘要
if [ -f "coverage/coverage-summary.json" ]; then
  echo ""
  echo "📈 测试覆盖率摘要："
  echo "=================================="
  node -e "
    const fs = require('fs');
    const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    const total = coverage.total;
    console.log('Statements:', total.statements.pct + '%');
    console.log('Branches:', total.branches.pct + '%');
    console.log('Functions:', total.functions.pct + '%');
    console.log('Lines:', total.lines.pct + '%');
  "
  echo "=================================="
fi

echo ""
echo "📝 测试报告位置："
echo "- HTML 覆盖率报告: coverage/lcov-report/index.html"
echo "- JSON 测试结果: test-results/test-results.json"
echo ""
echo "🎉 所有测试执行完毕！"