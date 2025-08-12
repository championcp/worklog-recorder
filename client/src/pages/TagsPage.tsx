import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Tag, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { Tag as TagType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type SortField = 'name' | 'color' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const TagsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const queryClient = useQueryClient();

  // 获取标签列表
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });

  // 搜索、排序和分页处理
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tags.filter((tag: TagType) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 排序
    filtered.sort((a: TagType, b: TagType) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'color':
          aValue = a.color || '#6B7280';
          bValue = b.color || '#6B7280';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tags, searchTerm, sortField, sortDirection]);

  // 分页处理
  const totalPages = Math.ceil(filteredAndSortedTags.length / pageSize);
  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedTags.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedTags, currentPage, pageSize]);

  // 排序处理函数
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // 重置到第一页
  };

  // 搜索处理函数
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // 重置到第一页
  };

  // 删除标签
  const deleteMutation = useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('标签删除成功');
    }
  });

  // 处理删除错误
  React.useEffect(() => {
    if (deleteMutation.error) {
      toast.error('删除标签失败');
    }
  }, [deleteMutation.error]);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个标签吗？删除后相关任务的标签将被移除。')) {
      deleteMutation.mutate(id);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>创建标签</span>
        </button>
      </div>

      {/* 搜索和统计信息 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索标签名称..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>搜索结果: {filteredAndSortedTags.length}</span>
            <span>总标签数: {tags.length}</span>
          </div>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredAndSortedTags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-gray-400 text-lg mb-2 mt-4">
              {searchTerm ? '未找到匹配的标签' : '暂无标签'}
            </div>
            <p className="text-gray-500">
              {searchTerm ? '尝试调整搜索条件' : '点击上方按钮创建第一个标签'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>标签名称</span>
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('color')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>颜色</span>
                        {sortField === 'color' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>创建时间</span>
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTags.map((tag: TagType) => (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="h-4 w-4 rounded-full mr-3"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {tag.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          -
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="h-6 w-6 rounded border border-gray-300"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            {tag.color || '#6B7280'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tag.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingTag(tag)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteMutation.isPending}
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

            {/* 分页组件 */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, filteredAndSortedTags.length)}
                      </span>{' '}
                      条，共 <span className="font-medium">{filteredAndSortedTags.length}</span> 条记录
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      
                      {/* 页码按钮 */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // 只显示当前页附近的页码
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 3 ||
                          page === currentPage + 3
                        ) {
                          return (
                            <span
                              key={page}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>)
        }
      </div>

      {/* 创建/编辑标签模态框 */}
      {(showCreateModal || editingTag) && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTag(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            setShowCreateModal(false);
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );
};

// 标签创建/编辑模态框组件
interface TagModalProps {
  tag?: TagType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TagModal: React.FC<TagModalProps> = ({ tag, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    color: tag?.color || '#3B82F6',
  });

  const createMutation = useMutation({
    mutationFn: api.createTag,
    onSuccess: () => {
      toast.success('标签创建成功');
      onSuccess();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateTag(id, data),
    onSuccess: () => {
      toast.success('标签更新成功');
      onSuccess();
    }
  });

  // 处理 mutation 错误
  React.useEffect(() => {
    if (createMutation.error) {
      toast.error('创建标签失败');
    }
    if (updateMutation.error) {
      toast.error('更新标签失败');
    }
  }, [createMutation.error, updateMutation.error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tag) {
      updateMutation.mutate({ id: tag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const predefinedColors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
    '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#6366F1', '#8B5CF6'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {tag ? '编辑标签' : '创建标签'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">标签名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field mt-1"
                placeholder="请输入标签名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标签颜色</label>
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
                {isLoading ? <LoadingSpinner size="small" /> : (tag ? '更新' : '创建')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TagsPage;