import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Tag, Space, Button, message, Row, Col, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, GlobalOutlined } from '@ant-design/icons';
import { investorsAPI } from '../services/api';
import { Investor } from '../types';
import InvestorDetailModal from '../components/InvestorDetailModal';

const { Search } = Input;
const { Option } = Select;

const Investors: React.FC = () => {
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
    has_website: undefined as boolean | undefined,
  });
  const [sorting, setSorting] = useState({
    sort_by: 'name',
    sort_order: 'asc',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  
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
      setInvestors(response.data.investors || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('투자사 목록 로딩 오류:', error);
      message.error(`투자사 목록을 불러오는데 실패했습니다: ${error.response?.data?.detail || error.message || '알 수 없는 오류'}`);
      setInvestors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
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

  const handleWebsiteFilterChange = (value: boolean | undefined) => {
    setFilters({ ...filters, has_website: value });
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
          <Select
            placeholder="웹사이트"
            allowClear
            style={{ width: 120 }}
            onChange={handleWebsiteFilterChange}
          >
            <Option value={true}>있음</Option>
            <Option value={false}>없음</Option>
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

      <Card
        title={`투자사 목록 (총 ${total}개)`}
        style={{ height: 'calc(100vh - 200px)' }}
        bodyStyle={{ 
          height: 'calc(100vh - 280px)', 
          overflowY: 'auto',
          padding: '16px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : investors.length > 0 ? (
          <Row gutter={[16, 16]}>
            {investors.map((investor) => (
              <Col key={investor.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    cursor: 'pointer',
                    border: investor.is_active ? '1px solid #d9d9d9' : '1px solid #ffccc7'
                  }}
                  onClick={() => handleInvestorClick(investor.id)}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: '#1890ff',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {investor.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {investor.type}
                    </div>
                  </div>
                  
                  {investor.sectors && investor.sectors.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      {investor.sectors.slice(0, 2).map((sector, index) => (
                        <Tag key={index} color="blue" style={{ marginBottom: '4px', fontSize: '11px' }}>
                          {sector}
                        </Tag>
                      ))}
                      {investor.sectors.length > 2 && (
                        <Tag color="default" style={{ fontSize: '11px' }}>
                          +{investor.sectors.length - 2}
                        </Tag>
                      )}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <div>
                      {investor.website ? (
                        <a 
                          href={investor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GlobalOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                        </a>
                      ) : (
                        <span style={{ color: '#d9d9d9' }}>-</span>
                      )}
                    </div>
                    <Tag color={investor.is_active ? 'green' : 'red'} style={{ fontSize: '11px' }}>
                      {investor.is_active ? '활성' : '비활성'}
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
            투자사가 없습니다.
          </div>
        )}
        
        {!loading && investors.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Space>
              <Button
                disabled={pagination.current === 1}
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
              >
                이전
              </Button>
              <span>
                {((pagination.current - 1) * pagination.pageSize + 1)} - {Math.min(pagination.current * pagination.pageSize, total)} / 총 {total}개
              </span>
              <Button
                disabled={pagination.current * pagination.pageSize >= total}
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
              >
                다음
              </Button>
            </Space>
          </div>
        )}
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
