import React from 'react';
import { Row, Col, Typography } from 'antd';
import { TimeAnalysisChart } from '@/components/analytics/TimeAnalysisChart';

const { Title } = Typography;

export const TimeAnalysisPage: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          时间分析
        </Title>
        <p style={{ color: '#666', marginTop: '8px' }}>
          深入分析您的工作时间分布和效率趋势
        </p>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <TimeAnalysisChart />
        </Col>
      </Row>
    </div>
  );
};