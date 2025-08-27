#!/bin/bash

# Nobody Logger 系统功能验证测试脚本
# 用于自动化验证系统核心功能

set -e

echo "🚀 Nobody Logger 系统功能验证测试"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果记录
TEST_RESULTS=()

# 记录测试结果的函数
log_test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        TEST_RESULTS+=("✅ PASS: $test_name")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ FAIL${NC}: $test_name - $message"
        TEST_RESULTS+=("❌ FAIL: $test_name - $message")
    fi
}

# 检查开发服务器是否运行
check_dev_server() {
    echo -e "\n${BLUE}📡 检查开发服务器状态...${NC}"
    
    # 检查端口3000是否被占用
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  开发服务器未运行，启动中...${NC}"
        npm run dev &
        DEV_SERVER_PID=$!
        
        # 等待服务器启动
        echo "等待服务器启动..."
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 开发服务器已启动${NC}"
                return 0
            fi
            sleep 2
            echo "等待中... ($i/30)"
        done
        
        log_test_result "开发服务器启动" "FAIL" "服务器启动超时"
        return 1
    else
        echo -e "${GREEN}✅ 开发服务器已运行${NC}"
        return 0
    fi
}

# 测试数据库连接
test_database_connection() {
    echo -e "\n${BLUE}🗄️  测试数据库连接...${NC}"
    
    if [ -f "data/nobody-logger.db" ]; then
        log_test_result "数据库文件存在" "PASS" ""
        
        # 检查数据库表
        tables=$(sqlite3 data/nobody-logger.db "SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "")
        if [[ $tables == *"users"* && $tables == *"projects"* && $tables == *"wbs_tasks"* ]]; then
            log_test_result "数据库表结构" "PASS" ""
        else
            log_test_result "数据库表结构" "FAIL" "缺少必要的表"
        fi
    else
        log_test_result "数据库文件存在" "FAIL" "数据库文件不存在"
    fi
}

# 测试API端点
test_api_endpoints() {
    echo -e "\n${BLUE}🌐 测试API端点...${NC}"
    
    # 测试认证相关API
    local auth_register_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"testapi@test.com","password":"123456","username":"testapi"}' \
        -o /tmp/auth_response.json)
    
    if [[ $auth_register_response =~ ^(200|201|400)$ ]]; then
        log_test_result "认证API - 注册端点" "PASS" ""
    else
        log_test_result "认证API - 注册端点" "FAIL" "HTTP状态码: $auth_register_response"
    fi
    
    # 测试登录API
    local auth_login_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@nobody-logger.com","password":"123456"}' \
        -o /tmp/login_response.json)
    
    if [[ $auth_login_response =~ ^(200|201|401)$ ]]; then
        log_test_result "认证API - 登录端点" "PASS" ""
    else
        log_test_result "认证API - 登录端点" "FAIL" "HTTP状态码: $auth_login_response"
    fi
    
    # 测试项目API
    local projects_response=$(curl -s -w "%{http_code}" -X GET http://localhost:3000/api/projects \
        -o /tmp/projects_response.json)
    
    if [[ $projects_response =~ ^(200|401)$ ]]; then
        log_test_result "项目API - 获取项目列表" "PASS" ""
    else
        log_test_result "项目API - 获取项目列表" "FAIL" "HTTP状态码: $projects_response"
    fi
    
    # 测试任务API
    local tasks_response=$(curl -s -w "%{http_code}" -X GET "http://localhost:3000/api/tasks?project_id=1" \
        -o /tmp/tasks_response.json)
    
    if [[ $tasks_response =~ ^(200|401)$ ]]; then
        log_test_result "任务API - 获取任务列表" "PASS" ""
    else
        log_test_result "任务API - 获取任务列表" "FAIL" "HTTP状态码: $tasks_response"
    fi
    
    # 测试时间记录API
    local timelogs_response=$(curl -s -w "%{http_code}" -X GET http://localhost:3000/api/time-logs \
        -o /tmp/timelogs_response.json)
    
    if [[ $timelogs_response =~ ^(200|401)$ ]]; then
        log_test_result "时间记录API - 获取时间记录" "PASS" ""
    else
        log_test_result "时间记录API - 获取时间记录" "FAIL" "HTTP状态码: $timelogs_response"
    fi
}

# 测试页面可访问性
test_page_accessibility() {
    echo -e "\n${BLUE}📄 测试页面可访问性...${NC}"
    
    # 测试首页
    local home_response=$(curl -s -w "%{http_code}" http://localhost:3000 -o /tmp/home_response.html)
    if [[ $home_response == "200" ]]; then
        log_test_result "首页访问" "PASS" ""
    else
        log_test_result "首页访问" "FAIL" "HTTP状态码: $home_response"
    fi
    
    # 测试登录页
    local login_response=$(curl -s -w "%{http_code}" http://localhost:3000/login -o /tmp/login_page.html)
    if [[ $login_response == "200" ]]; then
        log_test_result "登录页访问" "PASS" ""
    else
        log_test_result "登录页访问" "FAIL" "HTTP状态码: $login_response"
    fi
    
    # 测试注册页
    local register_response=$(curl -s -w "%{http_code}" http://localhost:3000/register -o /tmp/register_page.html)
    if [[ $register_response == "200" ]]; then
        log_test_result "注册页访问" "PASS" ""
    else
        log_test_result "注册页访问" "FAIL" "HTTP状态码: $register_response"
    fi
    
    # 测试仪表板页（应该重定向到登录）
    local dashboard_response=$(curl -s -w "%{http_code}" http://localhost:3000/dashboard -o /tmp/dashboard_response.html)
    if [[ $dashboard_response =~ ^(200|302|401)$ ]]; then
        log_test_result "仪表板页访问" "PASS" ""
    else
        log_test_result "仪表板页访问" "FAIL" "HTTP状态码: $dashboard_response"
    fi
}

# 运行构建测试
test_build_process() {
    echo -e "\n${BLUE}🔨 测试构建过程...${NC}"
    
    if npm run build > /tmp/build_output.log 2>&1; then
        log_test_result "项目构建" "PASS" ""
    else
        log_test_result "项目构建" "FAIL" "构建失败，查看 /tmp/build_output.log"
    fi
}

# 运行单元测试
test_unit_tests() {
    echo -e "\n${BLUE}🧪 运行单元测试...${NC}"
    
    if npm test -- --passWithNoTests --watchAll=false > /tmp/unit_tests.log 2>&1; then
        log_test_result "单元测试" "PASS" ""
    else
        log_test_result "单元测试" "FAIL" "测试失败，查看 /tmp/unit_tests.log"
    fi
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}🧹 清理测试环境...${NC}"
    
    # 如果我们启动了开发服务器，则终止它
    if [ ! -z "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
        echo "已停止开发服务器"
    fi
    
    # 清理临时文件
    rm -f /tmp/*_response.* /tmp/*_output.log /tmp/unit_tests.log 2>/dev/null || true
}

# 显示测试结果摘要
show_test_summary() {
    echo -e "\n${BLUE}📊 测试结果摘要${NC}"
    echo "=================================="
    echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"
    echo -e "成功率: ${BLUE}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
    
    echo -e "\n${BLUE}详细结果:${NC}"
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有测试通过！系统功能验证成功！${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️  有 $FAILED_TESTS 个测试失败，需要检查和修复${NC}"
        exit 1
    fi
}

# 主执行流程
main() {
    echo "开始系统功能验证测试..."
    
    # 设置清理陷阱
    trap cleanup EXIT
    
    # 执行各项测试
    test_database_connection
    test_build_process
    test_unit_tests
    check_dev_server
    test_page_accessibility
    test_api_endpoints
    
    # 显示结果摘要
    show_test_summary
}

# 检查是否作为脚本直接运行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi