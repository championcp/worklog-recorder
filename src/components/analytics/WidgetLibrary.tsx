import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Select, Typography, Space, Row, Col, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { WidgetDefinition } from '@/types/analytics';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface WidgetLibraryProps {
  widgets: WidgetDefinition[];
  onAddWidget: (widget: WidgetDefinition) => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  widgets,
  onAddWidget
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set(widgets.map(w => w.category));
    return [
      { value: 'all', label: '全部分类' },
      ...Array.from(cats).map(cat => ({
        value: cat,
        label: getCategoryLabel(cat)
      }))
    ];
  }, [widgets]);

  // 过滤小部件
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      const matchesSearch = !searchText || 
        widget.name.toLowerCase().includes(searchText.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [widgets, searchText, selectedCategory]);

  // 获取分类标签
  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      overview: '概览',
      project: '项目',
      time: '时间',
      team: '团队'
    };
    return labels[category] || category;
  }

  // 获取分类颜色
  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      overview: 'blue',
      project: 'green',
      time: 'orange',
      team: 'purple'
    };
    return colors[category] || 'default';
  }

  // 获取图标组件
  function getIconComponent(iconName: string) {
    // 这里可以根据iconName返回对应的图标组件
    // 暂时返回一个简单的占位符
    return (
      <div style={{
        width: '48px',
        height: '48px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {iconName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="widget-library">
      {/* 搜索和筛选 */}
      <div style={{ marginBottom: '16px' }}>
        <Search
          placeholder="搜索小部件..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: '12px' }}
          allowClear
        />
        
        <Select
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={{ width: '100%' }}
          placeholder="选择分类"
        >
          {categories.map(cat => (
            <Option key={cat.value} value={cat.value}>
              {cat.label}
            </Option>
          ))}
        </Select>
      </div>

      {/* 小部件列表 */}
      <div className="widget-list">
        {filteredWidgets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999'
          }}>
            <SearchOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
            <div>未找到匹配的小部件</div>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredWidgets.map((widget, index) => (
              <Col span={24} key={widget.type}>
                <Card
                  hoverable
                  style={{ 
                    height: '100%',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* 图标 */}
                    <div style={{ flexShrink: 0 }}>
                      {getIconComponent(widget.icon)}
                    </div>
                    
                    {/* 内容 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <Typography.Title 
                          level={5} 
                          style={{ margin: 0, fontSize: '14px' }}
                        >
                          {widget.name}
                        </Typography.Title>
                        
                        <Tag color={getCategoryColor(widget.category)} size="small">
                          {getCategoryLabel(widget.category)}
                        </Tag>
                      </div>
                      
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '12px', 
                          display: 'block',
                          marginBottom: '12px',
                          lineHeight: '1.4'
                        }}
                      >
                        {widget.description}
                      </Text>
                      
                      {/* 小部件信息 */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '11px',
                        color: '#999',
                        marginBottom: '12px'
                      }}>
                        <span>
                          尺寸: {widget.defaultSize.w}×{widget.defaultSize.h}
                        </span>
                        <Space size={8}>
                          {widget.configurable && (
                            <Tag size="small" color="blue">可配置</Tag>
                          )}
                          {widget.refreshable && (
                            <Tag size="small" color="green">可刷新</Tag>
                          )}
                        </Space>
                      </div>
                      
                      {/* 添加按钮 */}
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => onAddWidget(widget)}
                        style={{ width: '100%' }}
                      >
                        添加到仪表板
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* 使用说明 */}
      <div style={{ 
        marginTop: '24px', 
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <Typography.Title level={5} style={{ fontSize: '13px', marginBottom: '8px' }}>
          使用提示：
        </Typography.Title>
        <ul style={{ paddingLeft: '16px', margin: 0 }}>
          <li>点击"添加到仪表板"将小部件添加到您的仪表板</li>
          <li>添加后可以拖拽调整位置和大小</li>
          <li>支持配置的小部件可以点击设置按钮进行个性化配置</li>
          <li>可刷新的小部件会自动更新数据</li>
        </ul>
      </div>
    </div>
  );
};