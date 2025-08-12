#!/bin/bash

echo "🔍 验证API修复..."
echo

# 1. 测试健康检查
echo "1. 测试健康检查..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ 健康检查通过: $HEALTH_STATUS"
else
    echo "❌ 健康检查失败: $HEALTH_STATUS"
    exit 1
fi

echo

# 2. 登录获取token
echo "2. 登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"nobody","password":"Qzkj@2025"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ 登录成功，获取到token"
else
    echo "❌ 登录失败"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

echo

# 3. 测试年度计划API
echo "3. 测试年度计划API..."
YEARLY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3001/api/plans?type=yearly&year=2025" \
    -H "Authorization: Bearer $TOKEN")

if [ "$YEARLY_STATUS" = "200" ]; then
    echo "✅ 年度计划API正常: $YEARLY_STATUS"
    YEARLY_DATA=$(curl -s "http://localhost:3001/api/plans?type=yearly&year=2025" \
        -H "Authorization: Bearer $TOKEN")
    echo "   返回数据: $YEARLY_DATA"
else
    echo "❌ 年度计划API失败: $YEARLY_STATUS"
    exit 1
fi

echo

# 4. 测试月度计划API
echo "4. 测试月度计划API..."
MONTHLY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3001/api/plans?type=monthly&year=2025&month=1" \
    -H "Authorization: Bearer $TOKEN")

if [ "$MONTHLY_STATUS" = "200" ]; then
    echo "✅ 月度计划API正常: $MONTHLY_STATUS"
else
    echo "❌ 月度计划API失败: $MONTHLY_STATUS"
    exit 1
fi

echo

# 5. 测试周计划API
echo "5. 测试周计划API..."
WEEKLY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3001/api/plans?type=weekly&year=2025&month=1&week=1" \
    -H "Authorization: Bearer $TOKEN")

if [ "$WEEKLY_STATUS" = "200" ]; then
    echo "✅ 周计划API正常: $WEEKLY_STATUS"
else
    echo "❌ 周计划API失败: $WEEKLY_STATUS"
    exit 1
fi

echo

# 6. 测试日计划API
echo "6. 测试日计划API..."
DAILY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3001/api/plans?type=daily&year=2025&month=1&day=1" \
    -H "Authorization: Bearer $TOKEN")

if [ "$DAILY_STATUS" = "200" ]; then
    echo "✅ 日计划API正常: $DAILY_STATUS"
else
    echo "❌ 日计划API失败: $DAILY_STATUS"
    exit 1
fi

echo
echo "🎉 所有API测试通过！数据库问题已修复！"