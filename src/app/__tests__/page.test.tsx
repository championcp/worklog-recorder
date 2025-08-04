import { render, screen, waitFor } from '@testing-library/react'
import HomePage from '../page'

// Mock fetch globally
global.fetch = jest.fn()

describe('HomePage', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    ;(fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the main title and description', () => {
    // Mock fetch to return unauthenticated response
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false })
    })

    render(<HomePage />)
    
    expect(screen.getByText('Nobody Logger')).toBeInTheDocument()
    expect(screen.getByText('个人工作日志记录和时间管理系统')).toBeInTheDocument()
  })

  it('displays feature cards with correct content', () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false })
    })

    render(<HomePage />)
    
    expect(screen.getByText('WBS多层级管理')).toBeInTheDocument()
    expect(screen.getByText('时间记录分析')).toBeInTheDocument()
    expect(screen.getByText('自动报告生成')).toBeInTheDocument()
    
    expect(screen.getByText('支持年→半年→季度→月→周→日的完整工作分解结构')).toBeInTheDocument()
    expect(screen.getByText('智能时间统计，深度分析工作效率和时间分配')).toBeInTheDocument()
    expect(screen.getByText('自动汇总日报、周报、月报，提升工作总结效率')).toBeInTheDocument()
  })

  it('displays CTA buttons with correct links', () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false })
    })

    render(<HomePage />)
    
    const registerButton = screen.getByRole('link', { name: '开始使用' })
    const loginButton = screen.getByRole('link', { name: '立即登录' })
    
    expect(registerButton).toHaveAttribute('href', '/register')
    expect(loginButton).toHaveAttribute('href', '/login')
  })

  it('displays progress status section', () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false })
    })

    render(<HomePage />)
    
    expect(screen.getByText('用户认证系统已完成')).toBeInTheDocument()
    expect(screen.getByText('用户注册、登录、登出功能已实现并可正常使用，您可以开始体验系统功能')).toBeInTheDocument()
    expect(screen.getByText('开发进度: 60% - 用户认证系统完成')).toBeInTheDocument()
  })

  it('makes auth check API call on mount', async () => {
    const mockPush = jest.fn()
    const useRouter = jest.spyOn(require('next/navigation'), 'useRouter')
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    })

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false })
    })

    render(<HomePage />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/me')
    })
  })

  it('redirects to dashboard when user is authenticated', async () => {
    const mockPush = jest.fn()
    const useRouter = jest.spyOn(require('next/navigation'), 'useRouter')
    useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    })

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, user: { id: 1, username: 'testuser' } })
    })

    render(<HomePage />)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles auth check API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<HomePage />)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('认证检查失败:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})