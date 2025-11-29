import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Space,
  Typography,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Result,
  Button,
} from 'antd';
import { SearchOutlined, FileTextOutlined, HomeOutlined, LockOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { usePermissions } from '../utils/permissions';

const { Title } = Typography;

interface Investor {
  id: number;
  name: string;
  website?: string;
  has_report: boolean;
  latest_report_date?: string;
  latest_report_period?: string;
}

const Reports: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getInvestorsWithReports({
        has_report: true,
        limit: 1000,
      });
      setInvestors(response.data.investors || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      message.error('투자자 목록을 불러오는데 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestorClick = (investor: Investor) => {
    if (!investor.has_report) {
      message.warning('보고서가 없습니다.');
      return;
    }

    // 권한 체크
    if (!hasPermission('view_report_detail')) {
      message.warning('보고서 상세보기 권한이 없습니다.');
      return;
    }

    // 현재 탭에서 보고서 열기
    history.push(`/reports/view/${investor.id}`);
  };

  const filteredInvestors = investors.filter((investor) =>
    investor.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatNumber = (num: string | number | undefined) => {
    if (!num) return '-';
    if (typeof num === 'number') return num.toLocaleString();
    return num;
  };

  const columns = [
    {
      title: '투자사명',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Investor) => {
        const canViewDetail = hasPermission('view_report_detail');
        return (
          <a
            onClick={() => handleInvestorClick(record)}
            style={{ 
              cursor: canViewDetail ? 'pointer' : 'not-allowed', 
              color: canViewDetail ? '#1890ff' : '#722ed1' 
            }}
          >
            {!canViewDetail && <LockOutlined style={{ marginRight: 4 }} />}
            {text}
          </a>
        );
      },
    },
    {
      title: '최신 보고서',
      dataIndex: 'latest_report_period',
      key: 'latest_report_period',
      render: (text: string) => text || '-',
    },
    {
      title: '보고서 날짜',
      dataIndex: 'latest_report_date',
      key: 'latest_report_date',
      render: (text: string) => text || '-',
    },
    {
      title: '상태',
      key: 'has_report',
      render: (_: any, record: Investor) => (
        <Tag color={record.has_report ? 'green' : 'default'}>
          {record.has_report ? '보고서 있음' : '보고서 없음'}
        </Tag>
      ),
    },
  ];

  // 권한 체크
  if (!hasPermission('access_reports')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="보고서 페이지 접근 권한이 없습니다."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Title level={2}>
        <FileTextOutlined /> DIAA 보고서
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic title="총 투자자 수" value={total} />
        </Col>
        <Col span={8}>
          <Statistic title="보고서 보유 투자자" value={investors.length} />
        </Col>
        <Col span={8}>
          <Statistic
            title="보고서 미보유 투자자"
            value={total - investors.length}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            placeholder="투자사명으로 검색..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '100%' }}
          />
          <Table
            columns={columns}
            dataSource={filteredInvestors}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개`,
            }}
            size="small"
          />
        </Space>
      </Card>
    </div>
  );
};

export default Reports;

