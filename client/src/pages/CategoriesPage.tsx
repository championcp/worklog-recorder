import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Folder, Search, Eye, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Category } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const CategoriesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // 获取分类列表
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  // 获取分类统计信息
  const { data: categoryStats = {} } = useQuery({
    queryKey: ['category-stats'],
    queryFn: api.getCategoryStats,
  });

  // 搜索过滤
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categories, searchTerm]);

  // 删除分类
  const deleteMutation = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类删除成功');
    }
  });

  // 处理删除错误
  React.useEffect(() => {
    if (deleteMutation.error) {
      toast.error('删除分类失败');
    }
  }, [deleteMutation.error]);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个分类吗？删除后相关任务的分类将被清空。')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (categoryId: string) => {
    navigate(`/categories/${categoryId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建分类</span>
        </button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Folder className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">总分类数</p>
              <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">已使用分类</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.keys(categoryStats).filter(id => categoryStats[id] > 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">关联任务数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.values(categoryStats).reduce((sum: number, count: any) => sum + (count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Search className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">搜索结果</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredCategories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="搜索分类名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 分类列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-gray-400 text-lg mb-2 mt-4">
              {searchTerm ? '未找到匹配的分类' : '暂无分类'}
            </div>
            <p className="text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '点击上方按钮创建第一个分类'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    颜色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category: Category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-4 w-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-6 w-6 rounded border border-gray-300"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                        <span className="ml-2 text-sm text-gray-500">
                          {category.color || '#6B7280'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {categoryStats[category.id] || 0} 个任务
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(category.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-primary-600 hover:text-primary-900"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteMutation.isPending}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 创建/编辑分类模态框 */}
      {(showCreateModal || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setShowCreateModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
};

// 分类创建/编辑模态框组件
interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#6366F1',
  });

  const createMutation = useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => {
      toast.success('分类创建成功');
      onSuccess();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCategory(id, data),
    onSuccess: () => {
      toast.success('分类更新成功');
      onSuccess();
    }
  });

  // 处理 mutation 错误
  React.useEffect(() => {
    if (createMutation.error) {
      toast.error('创建分类失败');
    }
    if (updateMutation.error) {
      toast.error('更新分类失败');
    }
  }, [createMutation.error, updateMutation.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category) {
      updateMutation.mutate({ id: category.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const predefinedColors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
    '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {category ? '编辑分类' : '创建分类'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">分类名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field mt-1"
                placeholder="请输入分类名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">分类描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field mt-1"
                rows={3}
                placeholder="请输入分类描述（可选）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类颜色</label>
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">{formData.color}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="small" /> : (category ? '更新' : '创建')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;