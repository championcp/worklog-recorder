import React, { useState } from 'react';
import { Plus, FileText, Search, Filter, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import TemplateManager, { Template as TemplateManagerTemplate } from '../components/TemplateManager';
import { Template } from '../types';
import templateService from '../services/api';

const TemplatesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'task' | 'plan'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const queryClient = useQueryClient();

  // 获取模板列表
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates()
  });

  // 删除模板
  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('模板已删除');
    },
    onError: () => {
      toast.error('删除模板失败');
    }
  });

  // 复制模板
  const duplicateMutation = useMutation({
    mutationFn: (template: Template) => templateService.createTemplate({
      ...template,
      name: `${template.name} (副本)`,
      id: undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('模板已复制');
    },
    onError: () => {
      toast.error('复制模板失败');
    }
  });

  // 过滤模板
  const filteredTemplates = templates.filter((template: Template) => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || template.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCopyTemplate = (template: Template) => {
    duplicateMutation.mutate(template);
  };

  const handleEditTemplate = (template: Template) => {
    console.log('编辑模板:', template);
    // 这里可以添加编辑模板的逻辑
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    duplicateMutation.mutate(template);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="text-gray-600 mt-1">管理任务和计划模板，提高工作效率</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建模板
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总模板数</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">任务模板</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter((t: Template) => t.type === 'task').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">计划模板</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter((t: Template) => t.type === 'plan').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部模板</option>
              <option value="task">任务模板</option>
              <option value="plan">计划模板</option>
            </select>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">模板列表</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template: Template) => (
                <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-gray-600 mb-3">{template.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {template.type === 'task' ? '任务' : '计划'}
                        </span>
                        <span>创建时间: {new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看模板"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyTemplate(template)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="复制模板"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="编辑模板"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除模板"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无模板</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? '没有找到匹配的模板' 
                  : '开始创建您的第一个模板吧'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建模板
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 模板管理器组件 */}
      <TemplateManager
        onSelectTemplate={(template: TemplateManagerTemplate) => {
          // 转换 TemplateManagerTemplate 到 Template 类型
          const convertedTemplate: Template = {
            id: template.id,
            name: template.name,
            type: template.type as 'task' | 'plan',
            content: template.content,
            userId: 'current-user', // 添加缺失的 userId 属性
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt)
          };
          handleSelectTemplate(convertedTemplate);
        }}
        selectedType={filterType === 'all' ? undefined : filterType}
      />
    </div>
  );
};

export default TemplatesPage;