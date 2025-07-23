import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Save, 
  X, 
  FileText, 
  Clock, 
  Tag,
  Settings,
  Eye,
  Download,
  Upload
} from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'plan' | 'report' | 'worklog';
  category: string;
  content: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  isPublic: boolean;
  usageCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiline';
  label: string;
  defaultValue?: string;
  options?: string[]; // for select type
  required: boolean;
  placeholder?: string;
}

interface TemplateManagerProps {
  onSelectTemplate?: (template: Template) => void;
  selectedType?: Template['type'];
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  onSelectTemplate,
  selectedType
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Template['type'] | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 表单状态
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    description: '',
    type: 'task',
    category: '',
    content: '',
    variables: [],
    isDefault: false,
    isPublic: true,
    tags: []
  });

  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    type: 'text',
    label: '',
    required: false,
    placeholder: ''
  });

  // 加载模板数据
  useEffect(() => {
    loadTemplates();
  }, []);

  // 过滤模板
  useEffect(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(template => template.type === filterType);
    }

    if (selectedType) {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(template => template.category === filterCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, filterType, filterCategory, selectedType]);

  const loadTemplates = () => {
    const savedTemplates = localStorage.getItem('work_log_templates');
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
      setTemplates(parsed);
    } else {
      // 初始化默认模板
      const defaultTemplates = getDefaultTemplates();
      setTemplates(defaultTemplates);
      saveTemplates(defaultTemplates);
    }
  };

  const saveTemplates = (templatesToSave: Template[]) => {
    localStorage.setItem('work_log_templates', JSON.stringify(templatesToSave));
  };

  const getDefaultTemplates = (): Template[] => {
    return [
      {
        id: 'task-default',
        name: '标准任务模板',
        description: '用于创建标准工作任务的模板',
        type: 'task',
        category: '工作任务',
        content: `任务名称: {{title}}
任务描述: {{description}}
优先级: {{priority}}
预计完成时间: {{dueDate}}
负责人: {{assignee}}
相关标签: {{tags}}

详细说明:
{{details}}`,
        variables: [
          { name: 'title', type: 'text', label: '任务标题', required: true, placeholder: '请输入任务标题' },
          { name: 'description', type: 'multiline', label: '任务描述', required: true, placeholder: '请描述任务内容' },
          { name: 'priority', type: 'select', label: '优先级', required: true, options: ['低', '中', '高', '紧急'] },
          { name: 'dueDate', type: 'date', label: '截止日期', required: false },
          { name: 'assignee', type: 'text', label: '负责人', required: false, placeholder: '请输入负责人姓名' },
          { name: 'tags', type: 'text', label: '标签', required: false, placeholder: '用逗号分隔多个标签' },
          { name: 'details', type: 'multiline', label: '详细说明', required: false, placeholder: '请输入详细说明' }
        ],
        isDefault: true,
        isPublic: true,
        usageCount: 0,
        tags: ['任务', '工作', '标准'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'plan-weekly',
        name: '周计划模板',
        description: '用于制定周工作计划的模板',
        type: 'plan',
        category: '工作计划',
        content: `# {{title}}

## 本周目标
{{objectives}}

## 重点任务
{{keyTasks}}

## 时间安排
- 周一: {{monday}}
- 周二: {{tuesday}}
- 周三: {{wednesday}}
- 周四: {{thursday}}
- 周五: {{friday}}

## 预期成果
{{expectedResults}}

## 风险预估
{{risks}}`,
        variables: [
          { name: 'title', type: 'text', label: '计划标题', required: true, placeholder: '例如：第12周工作计划' },
          { name: 'objectives', type: 'multiline', label: '本周目标', required: true, placeholder: '请列出本周的主要目标' },
          { name: 'keyTasks', type: 'multiline', label: '重点任务', required: true, placeholder: '请列出本周的重点任务' },
          { name: 'monday', type: 'text', label: '周一安排', required: false },
          { name: 'tuesday', type: 'text', label: '周二安排', required: false },
          { name: 'wednesday', type: 'text', label: '周三安排', required: false },
          { name: 'thursday', type: 'text', label: '周四安排', required: false },
          { name: 'friday', type: 'text', label: '周五安排', required: false },
          { name: 'expectedResults', type: 'multiline', label: '预期成果', required: false },
          { name: 'risks', type: 'multiline', label: '风险预估', required: false }
        ],
        isDefault: true,
        isPublic: true,
        usageCount: 0,
        tags: ['计划', '周计划', '工作安排'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'report-daily',
        name: '日报模板',
        description: '用于撰写日工作报告的模板',
        type: 'report',
        category: '工作报告',
        content: `# {{date}} 工作日报

## 今日完成
{{completed}}

## 遇到问题
{{issues}}

## 明日计划
{{tomorrow}}

## 其他说明
{{notes}}

---
报告人: {{reporter}}
报告时间: {{reportTime}}`,
        variables: [
          { name: 'date', type: 'date', label: '日期', required: true },
          { name: 'completed', type: 'multiline', label: '今日完成', required: true, placeholder: '请列出今日完成的工作' },
          { name: 'issues', type: 'multiline', label: '遇到问题', required: false, placeholder: '请描述遇到的问题和解决方案' },
          { name: 'tomorrow', type: 'multiline', label: '明日计划', required: false, placeholder: '请列出明日的工作计划' },
          { name: 'notes', type: 'multiline', label: '其他说明', required: false, placeholder: '其他需要说明的内容' },
          { name: 'reporter', type: 'text', label: '报告人', required: true, placeholder: '请输入报告人姓名' },
          { name: 'reportTime', type: 'text', label: '报告时间', required: false, defaultValue: new Date().toLocaleString() }
        ],
        isDefault: true,
        isPublic: true,
        usageCount: 0,
        tags: ['报告', '日报', '工作总结'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: formData.name || '',
      description: formData.description || '',
      type: formData.type || 'task',
      category: formData.category || '',
      content: formData.content || '',
      variables: formData.variables || [],
      isDefault: false,
      isPublic: formData.isPublic || false,
      usageCount: 0,
      tags: formData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    setShowCreateModal(false);
    resetForm();
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplate: Template = {
      ...selectedTemplate,
      ...formData,
      updatedAt: new Date()
    };

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    setShowEditModal(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (副本)`,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    const updatedTemplates = [...templates, duplicatedTemplate];
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
  };

  const handleUseTemplate = (template: Template) => {
    const updatedTemplate = { ...template, usageCount: template.usageCount + 1 };
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? updatedTemplate : t
    );
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);

    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'task',
      category: '',
      content: '',
      variables: [],
      isDefault: false,
      isPublic: true,
      tags: []
    });
    setNewVariable({
      name: '',
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    });
  };

  const addVariable = () => {
    if (newVariable.name && newVariable.label) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), newVariable]
      }));
      setNewVariable({
        name: '',
        type: 'text',
        label: '',
        required: false,
        placeholder: ''
      });
    }
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  };

  const getTypeLabel = (type: Template['type']): string => {
    const labels = {
      task: '任务',
      plan: '计划',
      report: '报告',
      worklog: '工作日志'
    };
    return labels[type];
  };

  const getTypeColor = (type: Template['type']): string => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      plan: 'bg-green-100 text-green-800',
      report: 'bg-purple-100 text-purple-800',
      worklog: 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean);

  return (
    <div className="template-manager">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">模板管理</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>创建模板</span>
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {!selectedType && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as Template['type'] | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有类型</option>
            <option value="task">任务</option>
            <option value="plan">计划</option>
            <option value="report">报告</option>
            <option value="worklog">工作日志</option>
          </select>
        )}

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有分类</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* 模板头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                  {template.isDefault && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      默认
                    </span>
                  )}
                  {template.isPublic && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      公开
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 模板信息 */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="w-4 h-4 mr-2" />
                <span>{template.category}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>使用 {template.usageCount} 次</span>
              </div>
            </div>

            {/* 标签 */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreviewModal(true);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="预览"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="复制"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {!template.isDefault && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setFormData(template);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handleUseTemplate(template)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                使用模板
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无模板</h3>
          <p className="text-gray-600">创建您的第一个模板吧</p>
        </div>
      )}

      {/* 创建/编辑模板模态框 */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {showCreateModal ? '创建模板' : '编辑模板'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模板名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入模板名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模板类型 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Template['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="task">任务</option>
                    <option value="plan">计划</option>
                    <option value="report">报告</option>
                    <option value="worklog">工作日志</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入模板描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入分类名称"
                />
              </div>

              {/* 模板内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={10}
                  placeholder="请输入模板内容，使用 {{变量名}} 来定义变量"
                />
                <p className="text-sm text-gray-500 mt-1">
                  使用 {`{{变量名}}`} 来定义可替换的变量，例如：{`{{title}}`}、{`{{date}}`} 等
                </p>
              </div>

              {/* 变量定义 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  变量定义
                </label>
                
                {/* 已定义的变量 */}
                {formData.variables && formData.variables.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                          <span><strong>名称:</strong> {variable.name}</span>
                          <span><strong>标签:</strong> {variable.label}</span>
                          <span><strong>类型:</strong> {variable.type}</span>
                          <span><strong>必填:</strong> {variable.required ? '是' : '否'}</span>
                        </div>
                        <button
                          onClick={() => removeVariable(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 添加新变量 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">添加变量</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="变量名称"
                      value={newVariable.name}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="显示标签"
                      value={newVariable.label}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newVariable.type}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as TemplateVariable['type'] }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">文本</option>
                      <option value="multiline">多行文本</option>
                      <option value="number">数字</option>
                      <option value="date">日期</option>
                      <option value="select">选择</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="text"
                      placeholder="占位符文本"
                      value={newVariable.placeholder}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newVariable.required}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">必填</span>
                    </label>
                  </div>

                  <button
                    onClick={addVariable}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    添加变量
                  </button>
                </div>
              </div>

              {/* 其他设置 */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">公开模板</span>
                </label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={showCreateModal ? handleCreateTemplate : handleEditTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCreateModal ? '创建模板' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">模板预览</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">模板信息</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>名称:</strong> {selectedTemplate.name}</div>
                    <div><strong>类型:</strong> {getTypeLabel(selectedTemplate.type)}</div>
                    <div><strong>分类:</strong> {selectedTemplate.category}</div>
                    <div><strong>使用次数:</strong> {selectedTemplate.usageCount}</div>
                  </div>
                  <div className="mt-2">
                    <strong>描述:</strong> {selectedTemplate.description}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">模板内容</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {selectedTemplate.content}
                </pre>
              </div>

              {selectedTemplate.variables.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">变量列表</h4>
                  <div className="space-y-2">
                    {selectedTemplate.variables.map((variable, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div><strong>名称:</strong> {variable.name}</div>
                          <div><strong>标签:</strong> {variable.label}</div>
                          <div><strong>类型:</strong> {variable.type}</div>
                          <div><strong>必填:</strong> {variable.required ? '是' : '否'}</div>
                        </div>
                        {variable.placeholder && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>占位符:</strong> {variable.placeholder}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  setShowPreviewModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                使用模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;