import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Button, Card, Typography, Space, Drawer, Select, Input, message } from 'antd';
import { PlusOutlined, SaveOutlined, SettingOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { DashboardLayout, DashboardItem, WidgetDefinition, WIDGET_DEFINITIONS, DASHBOARD_BREAKPOINTS, DASHBOARD_COLS } from '@/types/analytics';
import { WidgetLibrary } from './WidgetLibrary';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetConfigDrawer } from './WidgetConfigDrawer';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardBuilderProps {
  initialLayout?: DashboardLayout;
  dashboardName?: string;
  isEditable?: boolean;
  onSave?: (layout: DashboardLayout, name: string) => Promise<void>;
  onPreview?: () => void;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialLayout,
  dashboardName = '新建仪表板',
  isEditable = true,
  onSave,
  onPreview
}) => {
  const [layout, setLayout] = useState<DashboardLayout>(
    initialLayout || { items: [] }
  );
  const [name, setName] = useState(dashboardName);
  const [isLibraryVisible, setIsLibraryVisible] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardItem | null>(null);
  const [isConfigDrawerVisible, setIsConfigDrawerVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setSaving] = useState(false);

  // 转换布局格式以适配 react-grid-layout
  const gridLayouts = useMemo(() => {
    const layouts: Record<string, any[]> = {};
    
    Object.keys(DASHBOARD_BREAKPOINTS).forEach(breakpoint => {
      layouts[breakpoint] = layout.items.map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        static: item.static || false
      }));
    });
    
    return layouts;
  }, [layout]);

  // 添加小部件
  const handleAddWidget = useCallback((widgetDef: WidgetDefinition) => {
    const newId = `${widgetDef.type}-${Date.now()}`;
    
    // 找到合适的位置放置新小部件
    const existingItems = layout.items;
    let x = 0;
    let y = 0;
    
    if (existingItems.length > 0) {
      const maxY = Math.max(...existingItems.map(item => item.y + item.h));
      y = maxY;
    }

    const newItem: DashboardItem = {
      i: newId,
      x,
      y,
      w: widgetDef.defaultSize.w,
      h: widgetDef.defaultSize.h,
      minW: widgetDef.minSize.w,
      minH: widgetDef.minSize.h,
      config: {
        type: widgetDef.type,
        title: widgetDef.name,
        refresh: 300, // 5分钟默认刷新
        filters: {},
        settings: {}
      }
    };

    setLayout(prev => ({
      items: [...prev.items, newItem]
    }));
    
    setIsLibraryVisible(false);
    message.success(`已添加 ${widgetDef.name} 小部件`);
  }, [layout.items]);

  // 更新布局
  const handleLayoutChange = useCallback((newLayout: any[], allLayouts: Record<string, any[]>) => {
    // 只在当前断点发生变化时更新
    const currentBreakpoint = getCurrentBreakpoint();
    const currentLayout = allLayouts[currentBreakpoint] || newLayout;
    
    setLayout(prev => ({
      items: prev.items.map(item => {
        const updatedItem = currentLayout.find(l => l.i === item.i);
        if (updatedItem) {
          return {
            ...item,
            x: updatedItem.x,
            y: updatedItem.y,
            w: updatedItem.w,
            h: updatedItem.h
          };
        }
        return item;
      })
    }));
  }, []);

  // 删除小部件
  const handleDeleteWidget = useCallback((widgetId: string) => {
    setLayout(prev => ({
      items: prev.items.filter(item => item.i !== widgetId)
    }));
    message.success('已删除小部件');
  }, []);

  // 配置小部件
  const handleConfigureWidget = useCallback((widgetId: string) => {
    const widget = layout.items.find(item => item.i === widgetId);
    if (widget) {
      setSelectedWidget(widget);
      setIsConfigDrawerVisible(true);
    }
  }, [layout.items]);

  // 更新小部件配置
  const handleWidgetConfigUpdate = useCallback((updatedConfig: any) => {
    if (!selectedWidget) return;
    
    setLayout(prev => ({
      items: prev.items.map(item =>
        item.i === selectedWidget.i
          ? { ...item, config: { ...item.config, ...updatedConfig } }
          : item
      )
    }));
    
    setIsConfigDrawerVisible(false);
    setSelectedWidget(null);
    message.success('小部件配置已更新');
  }, [selectedWidget]);

  // 保存仪表板
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(layout, name);
      message.success('仪表板保存成功');
    } catch (error) {
      console.error('保存仪表板失败:', error);
      message.error('保存仪表板失败');
    } finally {
      setSaving(false);
    }
  }, [layout, name, onSave]);

  // 获取当前断点
  const getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width >= DASHBOARD_BREAKPOINTS.lg) return 'lg';
    if (width >= DASHBOARD_BREAKPOINTS.md) return 'md';
    if (width >= DASHBOARD_BREAKPOINTS.sm) return 'sm';
    if (width >= DASHBOARD_BREAKPOINTS.xs) return 'xs';
    return 'xxs';
  };

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="dashboard-toolbar" style={{ 
      padding: '16px', 
      background: '#fff', 
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Input
          placeholder="仪表板名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '200px' }}
          disabled={!isEditable}
        />
        
        {isEditable && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsLibraryVisible(true)}
          >
            添加小部件
          </Button>
        )}
      </div>

      <Space>
        {onPreview && (
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewMode(!previewMode);
              onPreview();
            }}
          >
            {previewMode ? '退出预览' : '预览'}
          </Button>
        )}
        
        {isEditable && onSave && (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSave}
          >
            保存仪表板
          </Button>
        )}
      </Space>
    </div>
  );

  // 渲染小部件
  const renderWidget = (item: DashboardItem) => (
    <div key={item.i} className="dashboard-widget">
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.config.title}</span>
            {isEditable && !previewMode && (
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigureWidget(item.i);
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWidget(item.i);
                  }}
                />
              </Space>
            )}
          </div>
        }
        size="small"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, padding: '12px' }}
      >
        <WidgetRenderer config={item.config} />
      </Card>
    </div>
  );

  return (
    <div className="dashboard-builder" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderToolbar()}
      
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {layout.items.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: '#999'
          }}>
            <Typography.Title level={4} type="secondary">
              暂无小部件
            </Typography.Title>
            <Typography.Text type="secondary">
              点击「添加小部件」开始构建您的仪表板
            </Typography.Text>
            {isEditable && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsLibraryVisible(true)}
                style={{ marginTop: '16px' }}
              >
                添加小部件
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={gridLayouts}
            breakpoints={DASHBOARD_BREAKPOINTS}
            cols={DASHBOARD_COLS}
            rowHeight={60}
            margin={[16, 16]}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditable && !previewMode}
            isResizable={isEditable && !previewMode}
            compactType="vertical"
            preventCollision={false}
            useCSSTransforms={true}
          >
            {layout.items.map(renderWidget)}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* 小部件库抽屉 */}
      <Drawer
        title="小部件库"
        placement="right"
        width={400}
        open={isLibraryVisible}
        onClose={() => setIsLibraryVisible(false)}
        destroyOnClose
      >
        <WidgetLibrary
          widgets={WIDGET_DEFINITIONS}
          onAddWidget={handleAddWidget}
        />
      </Drawer>

      {/* 小部件配置抽屉 */}
      <Drawer
        title="小部件配置"
        placement="right"
        width={500}
        open={isConfigDrawerVisible}
        onClose={() => setIsConfigDrawerVisible(false)}
        destroyOnClose
      >
        {selectedWidget && (
          <WidgetConfigDrawer
            widget={selectedWidget}
            onSave={handleWidgetConfigUpdate}
            onCancel={() => setIsConfigDrawerVisible(false)}
          />
        )}
      </Drawer>
    </div>
  );
};