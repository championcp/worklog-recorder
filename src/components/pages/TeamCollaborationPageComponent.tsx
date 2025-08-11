import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Select, message } from 'antd';
import { TeamOutlined, UserAddOutlined, BarChartOutlined } from '@ant-design/icons';
import { TeamManagement } from '@/components/team/TeamManagement';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Project {
  id: number;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

const TeamCollaborationPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('management');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // TODO: 实现真实的API调用
      // const response = await fetch('/api/projects/my-projects');
      // const result = await response.json();
      
      // 模拟数据
      const mockProjects: Project[] = [
        { id: 1, name: '网站重构项目', role: 'owner' },
        { id: 2, name: '移动应用开发', role: 'editor' },
        { id: 3, name: '数据分析系统', role: 'viewer' }
      ];
      
      setProjects(mockProjects);
      
      // 默认选择第一个项目
      if (mockProjects.length > 0) {
        setSelectedProjectId(mockProjects[0].id);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
      message.error('加载项目失败');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          团队协作
        </Title>
        <Text type="secondary">
          管理项目团队成员，促进团队协作效率
        </Text>
      </div>

      {/* 项目选择器 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div>
            <Text strong>当前项目: </Text>
            <Select
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              style={{ width: 300, marginLeft: '8px' }}
              placeholder="请选择项目"
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{project.name}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      {project.role === 'owner' ? '所有者' : 
                       project.role === 'editor' ? '编辑者' : '查看者'}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          {selectedProject && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              您在此项目中的角色: {
                selectedProject.role === 'owner' ? '所有者' : 
                selectedProject.role === 'editor' ? '编辑者' : '查看者'
              }
            </Text>
          )}
        </div>
      </Card>

      {/* 主要内容区域 */}
      {selectedProject ? (
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            <TabPane 
              tab={
                <span>
                  <TeamOutlined />
                  团队管理
                </span>
              } 
              key="management"
            >
              <TeamManagement
                projectId={selectedProject.id}
                projectName={selectedProject.name}
                userRole={selectedProject.role}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  协作分析
                </span>
              } 
              key="analytics"
            >
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#999'
              }}>
                <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px' }}>协作分析功能开发中</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  即将推出团队协作效率分析、任务分配统计等功能
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      ) : (
        <Card>
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#999'
          }}>
            <UserAddOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px' }}>暂无可管理的项目</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              创建项目或等待邀请加入项目后，即可进行团队管理
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeamCollaborationPage;