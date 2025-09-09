import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Tag, Space, Button, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { investorsAPI } from '../services/api';
import { Investor } from '../types';
import InvestorDetailModal from '../components/InvestorDetailModal';

const { Search } = Input;
const { Option } = Select;

const Investors: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    is_active: undefined as boolean | undefined,
  });
  const [sorting, setSorting] = useState({
    sort_by: 'name',
    sort_order: 'asc',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  useEffect(() => {
    fetchInvestors();
  }, [pagination, filters, sorting]);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
        ...sorting,
      };
      
      const response = await investorsAPI.getInvestors(params);
      setInvestors(response.data.investors);
      setTotal(response.data.total);
    } catch (error) {
      message.error('투자사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleSectorChange = (value: string) => {
    setFilters({ ...filters, sector: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setFilters({ ...filters, is_active: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleInvestorClick = (investorId: number) => {
    setSelectedInvestorId(investorId);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedInvestorId(null);
  };

  const handleSortChange = (sortBy: string) => {
    setSorting(prev => ({
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setPagination({ ...pagination, current: 1 });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer' }}
          onClick={() => handleSortChange('name')}
        >
          투자사명
          {sorting.sort_by === 'name' && (
            <span style={{ marginLeft: 4 }}>
              {sorting.sort_order === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Investor) => (
        <div>
          <div 
            style={{ 
              fontWeight: 'bold', 
              color: '#1890ff', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => handleInvestorClick(record.id)}
          >
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.type}
          </div>
        </div>
      ),
    },
    {
      title: '전문분야',
      dataIndex: 'sectors',
      key: 'sectors',
      render: (sectors: string[]) => (
        <div>
          {sectors && sectors.length > 0 ? (
            sectors.slice(0, 3).map((sector, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                {sector}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )}
          {sectors && sectors.length > 3 && (
            <Tag color="default">+{sectors.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer' }}
          onClick={() => handleSortChange('article_count')}
        >
          기사 개수
          {sorting.sort_by === 'article_count' && (
            <span style={{ marginLeft: 4 }}>
              {sorting.sort_order === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
      ),
      dataIndex: 'article_count',
      key: 'article_count',
      width: 120,
      render: (articleCount: number, record: any) => (
        <div style={{ textAlign: 'center' }}>
          <Tag color="blue" style={{ fontSize: '12px' }}>
            {articleCount || 0}개
          </Tag>
        </div>
      ),
    },
    {
      title: '상태',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer' }}
          onClick={() => handleSortChange('created_at')}
        >
          등록일
          {sorting.sort_by === 'created_at' && (
            <span style={{ marginLeft: 4 }}>
              {sorting.sort_order === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </span>
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="투자사명 검색"
            allowClear
            style={{ width: 200 }}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="전문분야"
            allowClear
            style={{ width: 150 }}
            onChange={handleSectorChange}
          >
            <Option value="ICT">ICT</Option>
            <Option value="바이오">바이오</Option>
            <Option value="문화예술">문화예술</Option>
            <Option value="콘텐츠">콘텐츠</Option>
            <Option value="스포츠">스포츠</Option>
            <Option value="관광">관광</Option>
            <Option value="글로벌">글로벌</Option>
            <Option value="소프트웨어융합">소프트웨어융합</Option>
          </Select>
          <Select
            placeholder="상태"
            allowClear
            style={{ width: 120 }}
            onChange={handleStatusChange}
          >
            <Option value={true}>활성</Option>
            <Option value={false}>비활성</Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchInvestors}
            loading={loading}
          >
            새로고침
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={investors}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / 총 ${total}개`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <InvestorDetailModal
        visible={modalVisible}
        investorId={selectedInvestorId}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default Investors;
