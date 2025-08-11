/**
 * Component Tests for WBSTaskTree
 * Tests the React component functionality and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import WBSTaskTreeComponent from '../../src/components/WBSTaskTree';
import type { WBSTaskTree } from '../../src/types/project';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('WBSTaskTree Component', () => {
  const defaultProps = {
    projectId: 1,
    projectName: 'Test Project'
  };

  const mockTaskTree: WBSTaskTree[] = [
    {
      id: 1,
      project_id: 1,
      parent_id: null,
      wbs_code: '1',
      name: 'Root Task',
      description: 'Root task description',
      level: 1,
      level_type: 'yearly',
      sort_order: 1,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      estimated_hours: 120,
      actual_hours: 0,
      status: 'not_started',
      progress_percentage: 0,
      priority: 'medium',
      created_at: '2025-08-04T10:00:00.000Z',
      updated_at: '2025-08-04T10:00:00.000Z',
      sync_version: 1,
      is_deleted: 0,
      children: [
        {
          id: 2,
          project_id: 1,
          parent_id: 1,
          wbs_code: '1.1',
          name: 'Sub Task',
          description: 'Sub task description',
          level: 2,
          level_type: 'quarterly',
          sort_order: 1,
          start_date: null,
          end_date: null,
          estimated_hours: 40,
          actual_hours: 0,
          status: 'in_progress',
          progress_percentage: 50,
          priority: 'high',
          created_at: '2025-08-04T10:00:00.000Z',
          updated_at: '2025-08-04T10:00:00.000Z',
          sync_version: 1,
          is_deleted: 0,
          children: [],
          full_path: '1.1',
          depth: 2
        }
      ],
      full_path: '1',
      depth: 1
    }
  ];

  const mockApiResponse = {
    success: true,
    data: {
      tasks: mockTaskTree,
      stats: {
        total_tasks: 2,
        completed_tasks: 0,
        in_progress_tasks: 1,
        not_started_tasks: 1,
        avg_progress: 25,
        total_estimated_hours: 160,
        total_actual_hours: 0
      }
    },
    message: '任务列表获取成功',
    timestamp: '2025-08-04T10:00:00.000Z'
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      expect(screen.getByText('加载任务列表...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render task tree after loading', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Project - WBS任务管理')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Root Task')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // WBS code
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks?project_id=1&tree=true');
    });

    it('should render empty state when no tasks exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          data: { ...mockApiResponse.data, tasks: [] }
        })
      } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('暂无任务')).toBeInTheDocument();
      });
      
      expect(screen.getByText('创建您的第一个任务来开始使用WBS管理')).toBeInTheDocument();
      expect(screen.getByText('创建任务')).toBeInTheDocument();
    });

    it('should render error state when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'API错误' }
        })
      } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('API错误')).toBeInTheDocument();
      });
    });

    it('should render network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('网络错误，请重试')).toBeInTheDocument();
      });
    });
  });

  describe('Task Tree Navigation', () => {
    it('should expand and collapse nodes', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Initially, sub-task should not be visible (collapsed)
      expect(screen.queryByText('Sub Task')).not.toBeInTheDocument();

      // Find and click expand button
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      // Sub-task should now be visible
      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });

      // Click collapse button
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      fireEvent.click(collapseButton);

      // Sub-task should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('Sub Task')).not.toBeInTheDocument();
      });
    });

    it('should expand all nodes when "Expand All" is clicked', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const expandAllButton = screen.getByText('展开全部');
      fireEvent.click(expandAllButton);

      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });
    });

    it('should collapse all nodes when "Collapse All" is clicked', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // First expand all
      const expandAllButton = screen.getByText('展开全部');
      fireEvent.click(expandAllButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });

      // Then collapse all
      const collapseAllButton = screen.getByText('折叠全部');
      fireEvent.click(collapseAllButton);

      await waitFor(() => {
        expect(screen.queryByText('Sub Task')).not.toBeInTheDocument();
      });
    });
  });

  describe('Task Creation', () => {
    it('should open create form when "Create Root Task" is clicked', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('新建根任务')).toBeInTheDocument();
      });

      const createButton = screen.getByText('新建根任务');
      fireEvent.click(createButton);

      expect(screen.getByText('创建根任务')).toBeInTheDocument();
      expect(screen.getByLabelText('任务名称 *')).toBeInTheDocument();
    });

    it('should create root task successfully', async () => {
      const user = userEvent.setup();
      
      // Mock successful creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { 
              task: {
                id: 3,
                name: 'New Root Task',
                wbs_code: '2',
                level: 1
              }
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('新建根任务')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByText('新建根任务');
      await user.click(createButton);

      // Fill form
      const nameInput = screen.getByLabelText('任务名称 *');
      await user.type(nameInput, 'New Root Task');

      const levelTypeSelect = screen.getByDisplayValue('yearly');
      await user.selectOptions(levelTypeSelect, 'monthly');

      const prioritySelect = screen.getByDisplayValue('medium');
      await user.selectOptions(prioritySelect, 'high');

      // Submit form
      const submitButton = screen.getByText('创建任务');
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: 1,
            parent_id: undefined,
            name: 'New Root Task',
            description: '',
            level_type: 'monthly',
            start_date: '',
            end_date: '',
            estimated_hours: undefined,
            priority: 'high'
          })
        });
      });
    });

    it('should show validation error for empty task name', async () => {
      const user = userEvent.setup();
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('新建根任务')).toBeInTheDocument();
      });

      // Open create form
      const createButton = screen.getByText('新建根任务');
      await user.click(createButton);

      // Try to submit without name
      const submitButton = screen.getByText('创建任务');
      await user.click(submitButton);

      // Should show validation error
      expect(screen.getByText('任务名称不能为空')).toBeInTheDocument();
    });

    it('should open create sub-task form when "Add Child Task" is clicked', async () => {
      const user = userEvent.setup();
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Find add child button (should be in task actions)
      const addChildButton = screen.getByTitle('添加子任务');
      await user.click(addChildButton);

      expect(screen.getByText('在 "Root Task" 下创建子任务')).toBeInTheDocument();
    });
  });

  describe('Task Editing', () => {
    it('should open edit form when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('编辑任务');
      await user.click(editButton);

      expect(screen.getByText('编辑任务 - Root Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Root Task')).toBeInTheDocument();
    });

    it('should update task successfully', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { 
              task: {
                id: 1,
                name: 'Updated Root Task',
                status: 'in_progress'
              }
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Open edit form
      const editButton = screen.getByTitle('编辑任务');
      await user.click(editButton);

      // Update task name
      const nameInput = screen.getByDisplayValue('Root Task');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Root Task');

      // Update status
      const statusSelect = screen.getByDisplayValue('not_started');
      await user.selectOptions(statusSelect, 'in_progress');

      // Submit form
      const submitButton = screen.getByText('更新任务');
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Root Task',
            description: 'Root task description',
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            estimated_hours: 120,
            status: 'in_progress',
            progress_percentage: 0,
            priority: 'medium'
          })
        });
      });
    });
  });

  describe('Task Deletion', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('删除任务');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('确定要删除这个任务吗？删除后无法恢复。');
      
      mockConfirm.mockRestore();
    });

    it('should delete task when confirmed', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return true
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: '任务删除成功'
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockApiResponse,
            data: { ...mockApiResponse.data, tasks: [] }
          })
        } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('删除任务');
      await user.click(deleteButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFresh).toHaveBeenCalledWith('/api/tasks/1', {
          method: 'DELETE'
        });
      });
      
      mockConfirm.mockRestore();
    });

    it('should not delete task when cancelled', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('删除任务');
      await user.click(deleteButton);

      // Should not make delete API call
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
      
      mockConfirm.mockRestore();
    });
  });

  describe('Visual Indicators', () => {
    it('should display correct status badges', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Expand to show sub-task
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('未开始')).toBeInTheDocument(); // Root task
      expect(screen.getByText('进行中')).toBeInTheDocument(); // Sub task
    });

    it('should display correct priority indicators', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Expand to show sub-task
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });

      // Check priority indicators
      expect(screen.getByText('中')).toBeInTheDocument(); // Medium priority
      expect(screen.getByText('高')).toBeInTheDocument(); // High priority
    });

    it('should display progress bars correctly', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Expand to show sub-task
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Sub Task')).toBeInTheDocument();
      });

      // Check progress percentages
      expect(screen.getByText('0%')).toBeInTheDocument(); // Root task
      expect(screen.getByText('50%')).toBeInTheDocument(); // Sub task
    });

    it('should display WBS codes in monospace font', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      const wbsCode = screen.getByText('1');
      expect(wbsCode).toHaveClass('font-mono');
    });
  });

  describe('Error Handling', () => {
    it('should display error message and allow dismissal', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Test error message' }
        })
      } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      // Dismiss error
      const dismissButton = screen.getByText('×');
      await user.click(dismissButton);

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    it('should handle API errors during task creation', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: false,
            error: { message: '创建任务失败' }
          })
        } as Response);

      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('新建根任务')).toBeInTheDocument();
      });

      // Open create form and submit
      const createButton = screen.getByText('新建根任务');
      await user.click(createButton);

      const nameInput = screen.getByLabelText('任务名称 *');
      await user.type(nameInput, 'Test Task');

      const submitButton = screen.getByText('创建任务');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('创建任务失败')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Check for proper button roles and labels
      expect(screen.getByRole('button', { name: /展开全部/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /折叠全部/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /新建根任务/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<WBSTaskTreeComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Root Task')).toBeInTheDocument();
      });

      // Tab to first button
      await user.tab();
      expect(screen.getByRole('button', { name: /展开全部/i })).toHaveFocus();

      // Tab to next button
      await user.tab();
      expect(screen.getByRole('button', { name: /折叠全部/i })).toHaveFocus();
    });
  });
});