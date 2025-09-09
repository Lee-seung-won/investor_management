import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Input, Select, Tag, Space, Button, message, Modal, Form, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { investmentsAPI } from '../services/api';
import { Investment } from '../types';
import dayjs from 'dayjs';

const { Search, TextArea } = Input;
const { Option } = Select;

const Investments: React.FC = () => {
  const history = useHistory();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({
    startup_name: '',
    investor_name: '',
    round_type: '',
  });
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...filters,
      };
      
      const response = await investmentsAPI.getInvestments(params);
      setInvestments(response.data.investments);
      setTotal(response.data.total);
    } catch (error) {
      message.error('투자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const handleSearch = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, current: 1 });
  };


  const showInvestmentDetail = (investment: Investment) => {
    setSelectedInvestment(investment);
    setModalVisible(true);
  };

  const showEditModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    editForm.setFieldsValue({
      startup_name: investment.startup_name,
      investor_name: investment.investor_name,
      round_type: investment.round_type,
      amount: investment.amount,
      currency: investment.currency,
      sector: investment.sector,
      investment_date: investment.investment_date ? dayjs(investment.investment_date) : null,
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
      
      if (!selectedInvestment) return;

      const updateData = {
        startup_name: values.startup_name,
        investor_name: values.investor_name,
        round_type: values.round_type,
        amount: values.amount ? String(values.amount) : null,
        currency: values.currency || 'KRW',
        sector: values.sector,
        investment_date: values.investment_date ? values.investment_date.toISOString().split('T')[0] : null,
      };

      await investmentsAPI.updateInvestment(selectedInvestment.id, updateData);
      message.success('투자 정보가 수정되었습니다.');
      setEditModalVisible(false);
      editForm.resetFields();
      fetchInvestments();
    } catch (error) {
      message.error('투자 정보 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (investment: Investment) => {
    Modal.confirm({
      title: '투자 정보 삭제',
      content: `"${investment.startup_name}"의 투자 정보를 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await investmentsAPI.deleteInvestment(investment.id);
          message.success('투자 정보가 삭제되었습니다.');
          fetchInvestments();
        } catch (error) {
          message.error('투자 정보 삭제에 실패했습니다.');
        }
      },
    });
  };

  const showVerifyModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    form.setFieldsValue({
      is_correct: investment.is_correct,
      verification_notes: investment.verification_notes,
    });
    setVerifyModalVisible(true);
  };


  const handleVerify = async (values: any) => {
    if (!selectedInvestment) return;

    try {
      await investmentsAPI.verifyInvestment(selectedInvestment.id, {
        is_correct: values.is_correct,
        verification_notes: values.verification_notes,
        verified_by: 'admin',
      });
      message.success('투자 정보 검수가 완료되었습니다.');
      setVerifyModalVisible(false);
      fetchInvestments();
    } catch (error) {
      message.error('투자 정보 검수에 실패했습니다.');
    }
  };


  const formatAmount = (amount: number, currency: string) => {
    if (!amount) return '-';
    if (currency === 'KRW') {
      if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억원`;
      } else if (amount >= 10000) {
        return `${(amount / 10000).toFixed(0)}만원`;
      }
      return `${amount.toLocaleString()}원`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '스타트업',
      dataIndex: 'startup_name',
      key: 'startup_name',
      render: (text: string) => text || '-',
    },
    {
      title: '투자사',
      dataIndex: 'investor_name',
      key: 'investor_name',
      render: (text: string) => text || '-',
    },
    {
      title: '라운드',
      dataIndex: 'round_type',
      key: 'round_type',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '투자금액',
      key: 'amount',
      render: (record: Investment) => formatAmount(record.amount || 0, record.currency),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (text: any, record: Investment) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showInvestmentDetail(record)}
          >
            상세
          </Button>
          {!record.is_verified && (
            <Button
              type="link"
              size="small"
              onClick={() => showVerifyModal(record)}
            >
              검수
            </Button>
          )}
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

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="스타트업명 검색"
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => handleSearch('startup_name', value)}
            prefix={<SearchOutlined />}
          />
          <Search
            placeholder="투자사명 검색"
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => handleSearch('investor_name', value)}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="라운드 타입"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleSearch('round_type', value || '')}
          >
            <Option value="시드">시드</Option>
            <Option value="pre-seed">Pre-seed</Option>
            <Option value="시리즈 A">시리즈 A</Option>
            <Option value="시리즈 B">시리즈 B</Option>
            <Option value="시리즈 C">시리즈 C</Option>
          </Select>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchInvestments}
            loading={loading}
          >
            새로고침
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={investments}
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

      <Modal
        title="투자 정보 상세"
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
              showEditModal(selectedInvestment!);
            }}
          >
            수정
          </Button>,
        ]}
        width={800}
      >
        {selectedInvestment && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>스타트업:</strong> {selectedInvestment.startup_name || '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>투자사:</strong> {selectedInvestment.investor_name || '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>라운드:</strong> {selectedInvestment.round_type || '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>투자금액:</strong> {formatAmount(selectedInvestment.amount || 0, selectedInvestment.currency)}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>섹터:</strong> {selectedInvestment.sector || '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>투자일:</strong> {selectedInvestment.investment_date ? new Date(selectedInvestment.investment_date).toLocaleDateString('ko-KR') : '-'}
            </div>
            
            {/* 기사 정보 섹션 */}
            {selectedInvestment.article && (
              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12, color: '#1890ff' }}>📰 출처 기사 정보</h4>
                <div style={{ marginBottom: 8 }}>
                  <strong>기사 제목:</strong> 
                  <div style={{ marginTop: 4, fontSize: '14px', color: '#666' }}>
                    {selectedInvestment.article.title}
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>발행일:</strong> {selectedInvestment.article.published_at ? new Date(selectedInvestment.article.published_at).toLocaleDateString('ko-KR') : '-'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>소스:</strong> {selectedInvestment.article.source || '-'}
                </div>
                {selectedInvestment.article.url && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>URL:</strong> 
                    <a href={selectedInvestment.article.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                      기사 링크
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {selectedInvestment.verification_notes && (
              <div style={{ marginTop: 16 }}>
                <strong>검수 메모:</strong>
                <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  {selectedInvestment.verification_notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="투자 정보 검수"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        onOk={() => form.submit()}
        okText="검수 완료"
        cancelText="취소"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
        >
          <Form.Item
            name="is_correct"
            label="검수 결과"
            rules={[{ required: true, message: '검수 결과를 선택해주세요' }]}
          >
            <Select placeholder="검수 결과 선택">
              <Option value={true}>
                <CheckOutlined style={{ color: 'green' }} /> 승인
              </Option>
              <Option value={false}>
                <CloseOutlined style={{ color: 'red' }} /> 거부
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="verification_notes"
            label="검수 메모"
          >
            <TextArea
              rows={4}
              placeholder="검수 메모를 입력해주세요"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="투자 정보 수정"
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startup_name"
                label="스타트업명"
                rules={[{ required: true, message: '스타트업명을 입력해주세요' }]}
              >
                <Input placeholder="스타트업명을 입력하세요" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="investor_name"
                label="투자사명"
                rules={[{ required: true, message: '투자사명을 입력해주세요' }]}
              >
                <Input placeholder="투자사명을 입력하세요" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="round_type"
                label="투자 라운드"
              >
                <Select placeholder="투자 라운드 선택">
                  <Option value="시드">시드</Option>
                  <Option value="시리즈A">시리즈A</Option>
                  <Option value="시리즈B">시리즈B</Option>
                  <Option value="시리즈C">시리즈C</Option>
                  <Option value="시리즈D">시리즈D</Option>
                  <Option value="프리A">프리A</Option>
                  <Option value="프리B">프리B</Option>
                  <Option value="그로스">그로스</Option>
                  <Option value="기타">기타</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sector"
                label="섹터"
              >
                <Input placeholder="섹터를 입력하세요" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="투자금액"
              >
                <Input type="number" placeholder="투자금액을 입력하세요" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
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

          <Form.Item
            name="investment_date"
            label="투자일"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Investments;
