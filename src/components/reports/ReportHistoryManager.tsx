import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  message, 
  Typography,
  Tooltip,
  Progress,
  Modal,
  Input,
  Select,
  DatePicker
} from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportHistory {
  taskId: string;
  title: string;
  type: 'pdf' | 'excel' | 'html';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  fileSize?: number;
  downloadUrl?: string;
  downloadCount: number;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  errorMessage?: string;
  templateName?: string;
  createdBy: string;
}

export const ReportHistoryManager: React.FC = () => {
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null
  });

  const loadReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/history');
      const result = await response.json();
      const apiReports = (result?.data?.reports || []) as Array<any>;
      const mapped: ReportHistory[] = apiReports.map((r: any) => {
        const sizeToBytes = (s: string | null) => {
          if (!s || typeof s !== 'string') return undefined;
          const m = s.match(/([\d.]+)\s*(KB|MB|GB)/i);
          if (!m) return undefined;
          const val = parseFloat(m[1]);
          const unit = m[2].toUpperCase();
          const k = 1024;
          const mult = unit === 'KB' ? 1 : unit === 'MB' ? k : k * k;
          return Math.round(val * 1024 * mult);
        };
        return {
          taskId: r.id,
          title: r.name,
          type: (r.format || 'pdf') as 'pdf' | 'excel' | 'html',
          status: r.status,
          fileSize: sizeToBytes(r.size ?? null),
          downloadUrl: r.downloadUrl ?? undefined,
          downloadCount: 0,
          createdAt: r.generatedAt,
          errorMessage: r.error ?? undefined,
          templateName: r.type,
          createdBy: '系统'
        };
      });
      setReports(mapped);
    } catch (error) {
      console.error('加载报告历史失败:', error);
      message.error('加载报告历史失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    const interval = setInterval(() => {
      const processingTasks = reports.filter(r => r.status === 'processing' || r.status === 'queued');
      if (processingTasks.length > 0) {
        loadReports();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [reports, loadReports]);

  const handleDownload = (report: ReportHistory) => {
    if (report.downloadUrl) {
      const link = document.createElement('a');
      link.href = report.downloadUrl;
      link.download = `${report.title}.${report.type}`;
      link.click();
      
      // 更新下载次数
      setReports(prev => prev.map(r => 
        r.taskId === report.taskId 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ));
      
      message.success('下载已开始');
    } else {
      message.error('下载链接不可用');
    }
  };

  const handleDelete = (report: ReportHistory) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除报告 "${report.title}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await fetch(`/api/reports/history?id=${encodeURIComponent(report.taskId)}`, { method: 'DELETE' });
          const json = await res.json();
          if (!json?.success) {
            throw new Error(json?.message || '删除失败');
          }
          setReports(prev => prev.filter(r => r.taskId !== report.taskId));
          message.success('报告已删除');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleRetry = async (report: ReportHistory) => {
    try {
      // TODO: 实现重试API
      setReports(prev => prev.map(r => 
        r.taskId === report.taskId 
          ? { ...r, status: 'queued', errorMessage: undefined }
          : r
      ));
      message.success('已重新提交生成任务');
    } catch (error) {
      message.error('重试失败');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'success', 
          icon: <CheckCircleOutlined />, 
          text: '已完成' 
        };
      case 'processing':
        return { 
          color: 'processing', 
          icon: <LoadingOutlined spin />, 
          text: '生成中' 
        };
      case 'queued':
        return { 
          color: 'default', 
          icon: <ClockCircleOutlined />, 
          text: '队列中' 
        };
      case 'failed':
        return { 
          color: 'error', 
          icon: <ExclamationCircleOutlined />, 
          text: '失败' 
        };
      default:
        return { 
          color: 'default', 
          icon: null, 
          text: '未知' 
        };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpired = (expiresAt?: string) => {
    return expiresAt && dayjs(expiresAt).isBefore(dayjs());
  };

  const filteredReports = reports.filter(report => {
    if (filters.search && !report.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && report.status !== filters.status) {
      return false;
    }
    if (filters.type && report.type !== filters.type) {
      return false;
    }
    if (filters.dateRange) {
      const createdAt = dayjs(report.createdAt);
      if (createdAt.isBefore(filters.dateRange[0]) || createdAt.isAfter(filters.dateRange[1])) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    {
      title: '报告信息',
      key: 'info',
      render: (_: any, record: ReportHistory) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {record.title}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Space split={<span>•</span>}>
              <span>模板: {record.templateName}</span>
              <span>创建者: {record.createdBy}</span>
              <span>创建时间: {dayjs(record.createdAt).format('MM-DD HH:mm')}</span>
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '格式',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: ReportHistory) => {
        const config = getStatusConfig(status);
        return (
          <div>
            <Tag color={config.color} icon={config.icon}>
              {config.text}
            </Tag>
            {status === 'processing' && record.progress && (
              <Progress 
                percent={record.progress} 
                
                style={{ marginTop: '4px' }}
              />
            )}
            {status === 'failed' && record.errorMessage && (
              <Tooltip title={record.errorMessage}>
                <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '2px' }}>
                  {record.errorMessage.length > 20 
                    ? `${record.errorMessage.slice(0, 20)}...` 
                    : record.errorMessage
                  }
                </div>
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      title: '文件信息',
      key: 'fileInfo',
      width: 120,
      render: (_: any, record: ReportHistory) => {
        if (record.status !== 'completed') return '-';
        
        const expired = isExpired(record.expiresAt);
        
        return (
          <div style={{ fontSize: '12px' }}>
            <div>{formatFileSize(record.fileSize || 0)}</div>
            <div style={{ color: '#666' }}>
              下载: {record.downloadCount}次
            </div>
            {expired && (
              <div style={{ color: '#ff4d4f' }}>已过期</div>
            )}
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: ReportHistory) => (
        <Space>
          {record.status === 'completed' && record.downloadUrl && !isExpired(record.expiresAt) && (
            <Tooltip title="下载报告">
              <Button
                type="text"
               
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(record)}
              />
            </Tooltip>
          )}
          
          {record.status === 'failed' && (
            <Tooltip title="重新生成">
              <Button
                type="text"
               
                icon={<ReloadOutlined />}
                onClick={() => handleRetry(record)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="查看详情">
            <Button
              type="text"
             
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: '报告详情',
                  content: (
                    <div>
                      <p><strong>标题:</strong> {record.title}</p>
                      <p><strong>状态:</strong> {getStatusConfig(record.status).text}</p>
                      <p><strong>创建时间:</strong> {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                      {record.completedAt && (
                        <p><strong>完成时间:</strong> {dayjs(record.completedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                      )}
                      {record.expiresAt && (
                        <p><strong>过期时间:</strong> {dayjs(record.expiresAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                      )}
                      {record.fileSize && (
                        <p><strong>文件大小:</strong> {formatFileSize(record.fileSize)}</p>
                      )}
                      {record.errorMessage && (
                        <p><strong>错误信息:</strong> {record.errorMessage}</p>
                      )}
                    </div>
                  ),
                  width: 500
                });
              }}
            />
          </Tooltip>
          
          <Tooltip title="删除">
            <Button
              type="text"
             
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            报告历史
          </Title>
          <Text type="secondary">
            查看和管理已生成的报告
          </Text>
        </div>
        
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterVisible(true)}
          >
            筛选
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadReports}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="搜索报告标题"
            allowClear
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="taskId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 筛选弹窗 */}
      <Modal
        title="筛选条件"
        open={filterVisible}
        onCancel={() => setFilterVisible(false)}
        onOk={() => setFilterVisible(false)}
        destroyOnClose
      >
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>状态:</label>
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
              allowClear
              placeholder="选择状态"
            >
              <Option value="completed">已完成</Option>
              <Option value="processing">生成中</Option>
              <Option value="queued">队列中</Option>
              <Option value="failed">失败</Option>
            </Select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>格式:</label>
            <Select
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              style={{ width: '100%' }}
              allowClear
              placeholder="选择格式"
            >
              <Option value="pdf">PDF</Option>
              <Option value="excel">Excel</Option>
              <Option value="html">HTML</Option>
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>创建时间:</label>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
