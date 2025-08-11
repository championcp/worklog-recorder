'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  color: string;
  level: number;
  parent_id?: number;
}

interface CategorySelectorProps {
  selectedCategoryId?: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CategorySelector({
  selectedCategoryId,
  onCategoryChange,
  placeholder = '选择分类',
  disabled = false,
  className = ''
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取选中的分类
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  // 过滤分类
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理分类选择
  const handleCategorySelect = (category: Category | null) => {
    onCategoryChange(category?.id || null);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 处理搜索
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  // 渲染分类选项
  const renderCategoryOption = (category: Category) => {
    const indentLevel = category.level * 16;
    
    return (
      <div
        key={category.id}
        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
        style={{ paddingLeft: `${12 + indentLevel}px` }}
        onClick={() => handleCategorySelect(category)}
      >
        <div
          className="w-3 h-3 rounded mr-2 flex-shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-sm text-gray-900 truncate">{category.name}</span>
        {selectedCategoryId === category.id && (
          <span className="ml-auto text-xs text-blue-600">✓</span>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 选择器输入框 */}
      <div
        className={`
          relative w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedCategory ? (
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded mr-2 flex-shrink-0"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="block truncate text-sm text-gray-900">
              {selectedCategory.name}
            </span>
            {!disabled && (
              <button
                className="ml-auto p-1 hover:bg-gray-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategorySelect(null);
                }}
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        ) : (
          <span className="block truncate text-sm text-gray-500">
            {placeholder}
          </span>
        )}
        
        {!disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        )}
      </div>

      {/* 下拉菜单 */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="搜索分类..."
            />
          </div>

          {/* 分类选项 */}
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500">
                加载中...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500">
                {searchTerm ? '没有找到匹配的分类' : '暂无分类'}
              </div>
            ) : (
              <>
                {/* 清除选择选项 */}
                {selectedCategoryId && (
                  <div
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
                    onClick={() => handleCategorySelect(null)}
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">清除分类</span>
                  </div>
                )}
                
                {/* 分类列表 */}
                {filteredCategories.map(renderCategoryOption)}
              </>
            )}
          </div>

          {/* 快速操作 */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <button
              className="w-full px-3 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => {
                setIsOpen(false);
                // 这里可以打开分类管理对话框
                console.log('打开分类管理');
              }}
            >
              + 管理分类
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 简化的分类显示组件
interface CategoryDisplayProps {
  categoryId: number | null;
  categories?: Category[];
  className?: string;
}

export function CategoryDisplay({ categoryId, categories, className = '' }: CategoryDisplayProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories || []);

  // 如果没有传入categories，则自动加载
  useEffect(() => {
    if (!categories && categoryId) {
      const loadCategory = async () => {
        try {
          const response = await fetch('/api/categories');
          const data = await response.json();
          if (response.ok) {
            setLocalCategories(data.data.categories || []);
          }
        } catch (error) {
          console.error('加载分类失败:', error);
        }
      };
      loadCategory();
    }
  }, [categoryId, categories]);

  if (!categoryId) return null;

  const category = localCategories.find(cat => cat.id === categoryId);
  if (!category) return null;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        className="w-3 h-3 rounded mr-1 flex-shrink-0"
        style={{ backgroundColor: category.color }}
      />
      <span className="text-xs text-gray-600 truncate">{category.name}</span>
    </div>
  );
}