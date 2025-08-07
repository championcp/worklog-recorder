import React, { useState } from 'react';
import { Tabs, Typography, Card, Row, Col, Statistic, Space } from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined, 
  HistoryOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { ReportTemplateManager } from '@/components/reports/ReportTemplateManager';
import { ReportHistoryManager } from '@/components/reports/ReportHistoryManager';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');

  // 模拟统计数据
  const stats = {
    totalReports: 156,
    monthlyReports: 23,
    completedToday: 8,
    averageTime: 45 // 秒
  };

  const renderOverview = () => (
    <Row gutter={16} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="总报告数"
            value={stats.totalReports}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="本月生成"
            value={stats.monthlyReports}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="今日完成"
            value={stats.completedToday}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="平均生成时间"
            value={stats.averageTime}
            suffix="秒"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          报告中心
        </Title>
        <Text type="secondary">
          生成、管理和导出各类项目报告
        </Text>
      </div>

      {renderOverview()}

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
        >
          <TabPane 
            tab={
              <Space>
                <DownloadOutlined />
                生成报告
              </Space>
            } 
            key="generate"
          >
            <ReportGenerator />
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <FileTextOutlined />
                模板管理
              </Space>
            } 
            key="templates"
          >
            <ReportTemplateManager />
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <HistoryOutlined />
                报告历史
              </Space>
            } 
            key="history"
          >
            <ReportHistoryManager />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportsPage;