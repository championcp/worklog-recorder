'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, FolderIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FolderOpenIcon } from '@heroicons/react/24/solid';

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  level: number;
  parent_id?: number;
  task_count: number;
  is_active: boolean;
  children?: Category[];
  depth?: number;
}

interface CategoryManagerProps {
  onCategorySelect?: (category: Category | null) => void;
  selectedCategoryId?: number;
  showTaskCounts?: boolean;
}

export default function CategoryManager({ 
  onCategorySelect, 
  selectedCategoryId,
  showTaskCounts = true 
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories?tree=true&stats=true');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || '加载分类失败');
      }
      
      setCategories(data.data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 切换节点展开/折叠
  const toggleNode = (categoryId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  // 处理分类选择
  const handleCategorySelect = (category: Category) => {
    onCategorySelect?.(selectedCategoryId === category.id ? null : category);
  };

  // 删除分类
  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '删除分类失败');
      }

      await loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除分类失败');
    }
  };

  // 渲染分类树节点
  const renderCategoryNode = (category: Category, depth = 0) => {
    const isExpanded = expandedNodes.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="select-none">
        <div 
          className={`
            flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
          `}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => handleCategorySelect(category)}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren && (
            <button
              className="mr-1 p-1 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(category.id);
              }}
            >
              {isExpanded ? (
                <FolderOpenIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <FolderIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          {/* 分类图标 */}
          <div 
            className="w-4 h-4 rounded mr-2 flex-shrink-0"
            style={{ backgroundColor: category.color }}
          />
          
          {/* 分类名称 */}
          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
            {category.name}
          </span>
          
          {/* 任务数量 */}
          {showTaskCounts && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {category.task_count || 0}
            </span>
          )}
          
          {/* 操作按钮 */}
          <div className="ml-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCategory(category);
              }}
              title="编辑分类"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category);
              }}
              title="删除分类"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 子分类 */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">分类管理</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          新建分类
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={loadCategories}
            className="text-sm text-red-600 hover:text-red-800 underline mt-1"
          >
            重试
          </button>
        </div>
      )}

      {/* 分类树 */}
      <div className="p-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">暂无分类</p>
            <p className="text-xs text-gray-400 mt-1">点击"新建分类"开始组织您的任务</p>
          </div>
        ) : (
          <div className="space-y-1 group">
            {categories.map(category => renderCategoryNode(category))}
          </div>
        )}
      </div>

      {/* 创建分类对话框 */}
      {showCreateForm && (
        <CategoryForm
          onSubmit={async (formData) => {
            try {
              const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || '创建分类失败');
              }

              await loadCategories();
              setShowCreateForm(false);
            } catch (err) {
              alert(err instanceof Error ? err.message : '创建分类失败');
            }
          }}
          onCancel={() => setShowCreateForm(false)}
          parentCategories={categories}
        />
      )}

      {/* 编辑分类对话框 */}
      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          onSubmit={async (formData) => {
            try {
              const response = await fetch(`/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
              });

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || '更新分类失败');
              }

              await loadCategories();
              setEditingCategory(null);
            } catch (err) {
              alert(err instanceof Error ? err.message : '更新分类失败');
            }
          }}
          onCancel={() => setEditingCategory(null)}
          parentCategories={categories}
        />
      )}
    </div>
  );
}

// 分类表单组件
interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  parentCategories: Category[];
}

function CategoryForm({ category, onSubmit, onCancel, parentCategories }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#666666',
    icon: category?.icon || '',
    parent_id: category?.parent_id || null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  // 预设颜色
  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];

  // 扁平化分类列表（用于父分类选择）
  const flattenCategories = (cats: Category[], level = 0): Array<Category & { label: string }> => {
    const result: Array<Category & { label: string }> = [];
    
    cats.forEach(cat => {
      if (!category || cat.id !== category.id) { // 排除自己
        result.push({
          ...cat,
          label: '  '.repeat(level) + cat.name
        });
        
        if (cat.children) {
          result.push(...flattenCategories(cat.children, level + 1));
        }
      }
    });
    
    return result;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {category ? '编辑分类' : '新建分类'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 分类名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入分类名称"
                maxLength={100}
                required
              />
            </div>

            {/* 分类描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入分类描述（可选）"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* 父分类 */}
            {parentCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  父分类
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    parent_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- 选择父分类（可选）--</option>
                  {flattenCategories(parentCategories).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 分类颜色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类颜色
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#666666"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              
              {/* 预设颜色 */}
              <div className="grid grid-cols-8 gap-1">
                {presetColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '保存中...' : (category ? '更新' : '创建')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}