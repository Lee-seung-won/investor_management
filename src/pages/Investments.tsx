import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Input, Select, Tag, Space, Button, message, Modal, Form, DatePicker, Row, Col, List, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { investmentsAPI, investorsAPI } from '../services/api';
import { Investment } from '../types';
import dayjs from 'dayjs';

const { Search, TextArea } = Input;
const { Option } = Select;

interface InvestorWithCount {
  investor_id: number;
  investor_name: string;
  investment_count: number;
}

const Investments: React.FC = () => {
  const [investors, setInvestors] = useState<InvestorWithCount[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [investorSearchText, setInvestorSearchText] = useState('');

  // 활성화된 엑셀러레이터 목록 및 투자 개수 가져오기
  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await investorsAPI.getInvestorInvestmentCounts({ is_active: true });
      if (response.data && response.data.investors) {
        setInvestors(response.data.investors);
        // 첫 번째 투자사를 자동 선택 (아직 선택된 투자사가 없는 경우만)
        if (response.data.investors.length > 0 && selectedInvestorId === null) {
          setSelectedInvestorId(response.data.investors[0].investor_id);
        }
      }
    } catch (error: any) {
      console.error('투자사 목록 로딩 오류:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`투자사 목록을 불러오는데 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // 선택한 투자사의 투자 정보 목록 가져오기
  const fetchInvestments = useCallback(async () => {
    if (!selectedInvestorId) {
      setInvestments([]);
      setTotal(0);
      return;
    }

    try {
      setInvestmentsLoading(true);
      const params: any = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        investor_id: selectedInvestorId,
      };

      const response = await investmentsAPI.getInvestments(params);
      setInvestments(response.data.investments || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('투자 정보 로딩 오류:', error);
      message.error('투자 정보를 불러오는데 실패했습니다.');
    } finally {
      setInvestmentsLoading(false);
    }
  }, [selectedInvestorId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleInvestorClick = (investorId: number) => {
    setSelectedInvestorId(investorId);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
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
          fetchInvestors(); // 투자사 목록도 새로고침
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
      title: '섹터',
      dataIndex: 'sector',
      key: 'sector',
      width: 150,
      render: (text: string) => text ? <Tag color="purple">{text}</Tag> : '-',
    },
    {
      title: '투자일',
      dataIndex: 'investment_date',
      key: 'investment_date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('ko-KR') : '-',
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
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

  const selectedInvestor = investors.find(inv => inv.investor_id === selectedInvestorId);

  // 엑셀러레이터 목록 필터링
  const filteredInvestors = investors.filter(investor =>
    investor.investor_name.toLowerCase().includes(investorSearchText.toLowerCase())
  );

  return (
    <div>
      <Row gutter={16} style={{ height: 'calc(100vh - 100px)' }}>
        {/* 왼쪽: 엑셀러레이터 목록 */}
        <Col span={6} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card 
            title="엑셀러레이터 목록" 
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                size="small"
                onClick={fetchInvestors}
                loading={loading}
              />
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            bodyStyle={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '16px', 
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            <div style={{ marginBottom: '12px', flexShrink: 0 }}>
              <Input
                placeholder="엑셀러레이터 검색"
                prefix={<SearchOutlined />}
                value={investorSearchText}
                onChange={(e) => setInvestorSearchText(e.target.value)}
                allowClear
                size="small"
              />
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%'
            }}>
              <List
                loading={loading}
                dataSource={filteredInvestors}
                style={{ height: '100%' }}
                renderItem={(investor) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedInvestorId === investor.investor_id ? '#e6f7ff' : 'transparent',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      border: selectedInvestorId === investor.investor_id ? '1px solid #1890ff' : '1px solid #f0f0f0'
                    }}
                    onClick={() => handleInvestorClick(investor.investor_id)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: selectedInvestorId === investor.investor_id ? 'bold' : 'normal' }}>
                            {investor.investor_name}
                          </span>
                          <Badge 
                            count={investor.investment_count} 
                            style={{ backgroundColor: investor.investment_count > 0 ? '#1890ff' : '#d9d9d9' }}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* 오른쪽: 투자 정보 목록 */}
        <Col span={18}>
          <Card 
            title={selectedInvestor ? `${selectedInvestor.investor_name}의 투자 정보` : '투자 정보 목록'}
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchInvestments}
                loading={investmentsLoading}
              >
                새로고침
              </Button>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto' }}
          >
            {selectedInvestorId ? (
              <Table
                columns={columns}
                dataSource={investments}
                rowKey="id"
                loading={investmentsLoading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} / 총 ${total}개`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 1000, y: 'calc(100vh - 300px)' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                왼쪽에서 엑셀러레이터를 선택하세요
              </div>
            )}
          </Card>
        </Col>
      </Row>

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
