import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Typography, Row, Col, Statistic, message, Modal, Form, DatePicker } from 'antd';
import { SearchOutlined, FundOutlined, DeleteOutlined } from '@ant-design/icons';
import { fundsAPI } from '../services/api.ts';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

interface Fund {
  id: number;
  article_id: number;
  fund_name: string;
  fund_amount?: string;
  fund_currency: string;
  fund_establishment_date?: string;
  fund_duration?: string;
  fund_end_date?: string;
  fund_sector?: string;
  fund_manager?: string;
  extraction_method: string;
  is_verified: boolean;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

const Funds: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    sector: '',
    fund_manager: '',
  });
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  const fetchFunds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fundsAPI.getFunds({
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
      });
      
      // 클라이언트 사이드 필터링
      let filteredFunds = response.data;
      
      if (filters.search) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.fund_name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.sector) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.fund_sector === filters.sector
        );
      }
      
      if (filters.fund_manager) {
        filteredFunds = filteredFunds.filter(fund => 
          fund.fund_manager && fund.fund_manager.toLowerCase().includes(filters.fund_manager.toLowerCase())
        );
      }
      
      setFunds(filteredFunds);
      setPagination(prev => ({
        ...prev,
        total: filteredFunds.length,
      }));
    } catch (error) {
      console.error('펀드 목록 조회 실패:', error);
      message.error('펀드 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters.search, filters.sector, filters.fund_manager]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const showFundDetail = (fund: Fund) => {
    setSelectedFund(fund);
    setModalVisible(true);
  };

  const showEditModal = (fund: Fund) => {
    setSelectedFund(fund);
    editForm.setFieldsValue({
      fund_name: fund.fund_name,
      fund_amount: fund.fund_amount,
      fund_currency: fund.fund_currency,
      fund_sector: fund.fund_sector,
      fund_manager: fund.fund_manager,
      fund_establishment_date: fund.fund_establishment_date ? moment(fund.fund_establishment_date) : null,
      fund_duration: fund.fund_duration,
      fund_end_date: fund.fund_end_date ? moment(fund.fund_end_date) : null,
    });
    setEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    editForm.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (!selectedFund) return;

      const updateData = {
        fund_name: values.fund_name,
        fund_amount: values.fund_amount,
        fund_currency: values.fund_currency || 'KRW',
        fund_sector: values.fund_sector,
        fund_manager: values.fund_manager,
        fund_establishment_date: values.fund_establishment_date ? values.fund_establishment_date.format('YYYY-MM-DD') : null,
        fund_duration: values.fund_duration,
        fund_end_date: values.fund_end_date ? values.fund_end_date.format('YYYY-MM-DD') : null,
      };

      await fundsAPI.updateFund(selectedFund.id, updateData);
      message.success('펀드 정보가 수정되었습니다.');
      setEditModalVisible(false);
      editForm.resetFields();
      fetchFunds();
    } catch (error) {
      message.error('펀드 정보 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (fund: Fund) => {
    Modal.confirm({
      title: '펀드 정보 삭제',
      content: `"${fund.fund_name}"의 펀드 정보를 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await fundsAPI.deleteFund(fund.id);
          message.success('펀드 정보가 삭제되었습니다.');
          fetchFunds();
        } catch (error) {
          message.error('펀드 정보 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFunds();
  };

  const handleReset = () => {
    setFilters({ search: '', sector: '', fund_manager: '' });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFunds();
  };

  const columns = [
    {
      title: '펀드명',
      dataIndex: 'fund_name',
      key: 'fund_name',
      width: 200,
      render: (text: string) => (
        <Typography.Text strong style={{ color: '#1890ff' }}>
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '펀드 규모',
      dataIndex: 'fund_amount',
      key: 'fund_amount',
      width: 120,
      render: (amount: string, record: Fund) => (
        <Space>
          <span style={{ color: '#52c41a' }}>💰</span>
          {amount ? `${amount} ${record.fund_currency}` : '-'}
        </Space>
      ),
    },
    {
      title: '투자 섹터',
      dataIndex: 'fund_sector',
      key: 'fund_sector',
      width: 120,
      render: (sector: string) => (
        sector ? <Tag color="blue">{sector}</Tag> : '-'
      ),
    },
    {
      title: '펀드 운용사',
      dataIndex: 'fund_manager',
      key: 'fund_manager',
      width: 150,
      render: (manager: string) => manager || '-',
    },
    {
      title: '결성일',
      dataIndex: 'fund_establishment_date',
      key: 'fund_establishment_date',
      width: 120,
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString('ko-KR') : '-'
      ),
    },
    {
      title: '운용기간',
      dataIndex: 'fund_duration',
      key: 'fund_duration',
      width: 100,
      render: (duration: string) => duration || '-',
    },
    {
      title: '종료예정일',
      dataIndex: 'fund_end_date',
      key: 'fund_end_date',
      width: 120,
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString('ko-KR') : '-'
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (text: any, record: Fund) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showFundDetail(record)}
          >
            상세
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  // 통계 계산
  const totalFunds = funds.length;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <FundOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          펀드 정보 관리
        </Title>
        
        {/* 통계 카드 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="총 펀드 수"
                value={totalFunds}
                prefix={<FundOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 검색 필터 */}
        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="펀드명 검색"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                prefix={<SearchOutlined />}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="펀드 운용사 검색"
                value={filters.fund_manager}
                onChange={(e) => setFilters(prev => ({ ...prev, fund_manager: e.target.value }))}
                prefix={<SearchOutlined />}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="투자 섹터"
                value={filters.sector}
                onChange={(value) => setFilters(prev => ({ ...prev, sector: value }))}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="IT">IT</Option>
                <Option value="바이오">바이오</Option>
                <Option value="핀테크">핀테크</Option>
                <Option value="인공지능">인공지능</Option>
                <Option value="게임">게임</Option>
                <Option value="콘텐츠">콘텐츠</Option>
                <Option value="이커머스">이커머스</Option>
                <Option value="헬스케어">헬스케어</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Space>
                <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                  검색
                </Button>
                <Button onClick={handleReset}>
                  초기화
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 펀드 목록 테이블 */}
        <Table
          columns={columns}
          dataSource={funds}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}개`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="펀드 정보 상세"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            닫기
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setModalVisible(false);
              showEditModal(selectedFund!);
            }}
          >
            수정
          </Button>,
        ]}
        width={800}
      >
        {selectedFund && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>펀드명:</strong> {selectedFund.fund_name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>펀드 규모:</strong> {selectedFund.fund_amount ? `${selectedFund.fund_amount} ${selectedFund.fund_currency}` : '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>투자 섹터:</strong> {selectedFund.fund_sector ? <Tag color="blue">{selectedFund.fund_sector}</Tag> : '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>펀드 운용사:</strong> {selectedFund.fund_manager || '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>결성일:</strong> {selectedFund.fund_establishment_date ? new Date(selectedFund.fund_establishment_date).toLocaleDateString('ko-KR') : '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>운용기간:</strong> {selectedFund.fund_duration ? `${selectedFund.fund_duration}년` : '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>종료예정일:</strong> {selectedFund.fund_end_date ? new Date(selectedFund.fund_end_date).toLocaleDateString('ko-KR') : '-'}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="펀드 정보 수정"
        open={editModalVisible}
        onCancel={handleEditCancel}
        onOk={handleEditSubmit}
        okText="수정 완료"
        cancelText="취소"
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="fund_name"
            label="펀드명"
            rules={[{ required: true, message: '펀드명을 입력해주세요' }]}
          >
            <Input placeholder="펀드명을 입력하세요" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fund_amount"
                label="펀드 규모"
              >
                <Input placeholder="펀드 규모를 입력하세요" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fund_currency"
                label="통화"
                initialValue="KRW"
              >
                <Select>
                  <Option value="KRW">KRW</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                  <Option value="JPY">JPY</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fund_sector"
                label="투자 섹터"
              >
                <Input placeholder="투자 섹터를 입력하세요" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fund_manager"
                label="펀드 운용사"
              >
                <Input placeholder="펀드 운용사를 입력하세요" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fund_establishment_date"
                label="결성일"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fund_duration"
                label="운용기간"
              >
                <Input placeholder="운용기간을 입력하세요 (년)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="fund_end_date"
            label="종료예정일"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Funds;
