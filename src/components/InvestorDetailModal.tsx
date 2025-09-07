import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Card, Tag, Descriptions, Table, Button, Spin, message, Typography, Input, Switch, Form, Select } from 'antd';
import { GlobalOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { investorsAPI } from '../services/api.ts';
import { Investor, Article } from '../types/index';
import ArticleDetailModal from './ArticleDetailModal.tsx';
import InvestmentInputModal from './InvestmentInputModal.tsx';

const { TabPane } = Tabs;
const { Text, Paragraph } = Typography;

interface InvestorDetailModalProps {
  visible: boolean;
  investorId: number | null;
  onClose: () => void;
}

const InvestorDetailModal: React.FC<InvestorDetailModalProps> = ({
  visible,
  investorId,
  onClose
}) => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [articles, setArticles] = useState<{
    general: Article[];
    funding: Article[];
    investment: Article[];
  }>({
    general: [],
    funding: [],
    investment: []
  });
  const [investmentHistory, setInvestmentHistory] = useState<any[]>([]);
  const [investmentHistoryLoading, setInvestmentHistoryLoading] = useState(false);
  const [fundHistory, setFundHistory] = useState<any[]>([]);
  const [fundHistoryLoading, setFundHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [investmentModalVisible, setInvestmentModalVisible] = useState(false);

  const fetchInvestorDetail = useCallback(async () => {
    if (!investorId) return;
    
    try {
      setLoading(true);
      const response = await investorsAPI.getInvestor(investorId);
      setInvestor(response.data);
      form.setFieldsValue({
        website: response.data.website,
        contact: response.data.contact,
        is_active: response.data.is_active
      });
    } catch (error) {
      message.error('투자사 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [investorId, form]);

  useEffect(() => {
    if (visible && investorId) {
      fetchInvestorDetail();
      // 투자사가 변경될 때마다 모든 데이터 초기화
      setArticles({
        general: [],
        funding: [],
        investment: []
      });
      setInvestmentHistory([]);
      setFundHistory([]);
    }
  }, [visible, investorId, fetchInvestorDetail]);

  const fetchArticles = async (category: string) => {
    if (!investorId) return;
    
    try {
      setArticlesLoading(true);
      const response = await investorsAPI.getInvestorArticles(investorId, {
        category,
        limit: 20
      });
      
      setArticles(prev => ({
        ...prev,
        [category]: response.data.articles
      }));
    } catch (error) {
      message.error(`${category} 기사를 불러오는데 실패했습니다.`);
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchInvestmentHistory = async () => {
    if (!investorId) return;
    
    setInvestmentHistoryLoading(true);
    try {
      const response = await investorsAPI.getInvestorInvestmentHistory(investorId, {
        limit: 50
      });
      
      console.log('투자 이력 조회 결과:', response.data);
      setInvestmentHistory(response.data.investments || []);
    } catch (error) {
      console.error('투자 이력 조회 실패:', error);
      message.error('투자 이력을 불러오는데 실패했습니다.');
    } finally {
      setInvestmentHistoryLoading(false);
    }
  };

  const fetchFundHistory = async () => {
    if (!investorId) return;
    
    setFundHistoryLoading(true);
    try {
      const response = await investorsAPI.getInvestorFundHistory(investorId, {
        limit: 50
      });
      
      console.log('펀드 이력 조회 결과:', response.data);
      setFundHistory(response.data.funds || []);
    } catch (error) {
      console.error('펀드 이력 조회 실패:', error);
      message.error('펀드 이력을 불러오는데 실패했습니다.');
    } finally {
      setFundHistoryLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key !== 'info' && key !== 'investment-history' && key !== 'fund-history') {
      // 기사 탭인 경우 항상 새로 로드 (투자사가 변경되었을 수 있으므로)
      fetchArticles(key);
    } else if (key === 'investment-history') {
      // 투자 이력도 항상 새로 로드
      fetchInvestmentHistory();
    } else if (key === 'fund-history') {
      // 펀드 이력도 항상 새로 로드
      fetchFundHistory();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      website: investor?.website,
      contact: investor?.contact,
      email: investor?.email,
      is_active: investor?.is_active,
      sectors: investor?.sectors || [],
      description: investor?.description
    });
  };

  const handleSave = async () => {
    if (!investorId) return;
    
    try {
      const values = await form.validateFields();
      console.log('Sending update data:', values); // 디버깅용
      const response = await investorsAPI.updateInvestor(investorId, values);
      setInvestor(response.data);
      setIsEditing(false);
      message.success('투자사 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Update error:', error); // 디버깅용
      message.error('투자사 정보 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.setFieldsValue({
      website: investor?.website,
      contact: investor?.contact,
      email: investor?.email,
      is_active: investor?.is_active,
      sectors: investor?.sectors || [],
      description: investor?.description
    });
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setInvestmentModalVisible(true);
  };

  const handleArticleModalClose = () => {
    setArticleModalVisible(false);
    setSelectedArticle(null);
  };

  const handleInvestmentModalClose = () => {
    setInvestmentModalVisible(false);
    setSelectedArticle(null);
  };

  const articleColumns = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <div>
          <Text 
            strong 
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleArticleClick(record)}
          >
            {text}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.source} • {record.published_at ? new Date(record.published_at).toLocaleDateString('ko-KR') : '날짜 없음'}
          </Text>
        </div>
      ),
    },
    {
      title: '처리상태',
      dataIndex: 'processing_status',
      key: 'processing_status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'orange', text: '대기' },
          processing: { color: 'blue', text: '처리중' },
          completed: { color: 'green', text: '완료' },
          error: { color: 'red', text: '오류' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (text: any, record: Article) => (
        <div>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleArticleClick(record)}
          >
            투자정보입력
          </Button>
          <br />
          <Button 
            type="link" 
            size="small"
            onClick={() => window.open(record.url, '_blank')}
          >
            원문보기
          </Button>
        </div>
      ),
    },
  ];

  const investmentHistoryColumns = [
    {
      title: '스타트업',
      dataIndex: 'startup_name',
      key: 'startup_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '투자 라운드',
      dataIndex: 'round_type',
      key: 'round_type',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '투자 금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: any) => {
        if (!amount) return '-';
        return (
          <Text>
            {amount} {record.currency || 'KRW'}
          </Text>
        );
      },
    },
    {
      title: '섹터',
      dataIndex: 'sector',
      key: 'sector',
      render: (text: string) => text ? <Tag color="green">{text}</Tag> : '-',
    },
    {
      title: '투자일',
      dataIndex: 'investment_date',
      key: 'investment_date',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
      width: 120,
    },
  ];

  const fundHistoryColumns = [
    {
      title: '펀드명',
      dataIndex: 'fund_name',
      key: 'fund_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '펀드 규모',
      dataIndex: 'fund_amount',
      key: 'fund_amount',
      render: (amount: string, record: any) => {
        if (!amount) return '-';
        return (
          <Text>
            {amount} {record.fund_currency || 'KRW'}
          </Text>
        );
      },
    },
    {
      title: '섹터',
      dataIndex: 'fund_sector',
      key: 'fund_sector',
      render: (text: string) => text ? <Tag color="purple">{text}</Tag> : '-',
    },
    {
      title: '결성일',
      dataIndex: 'fund_establishment_date',
      key: 'fund_establishment_date',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
      width: 120,
    },
    {
      title: '운용기간',
      dataIndex: 'fund_duration',
      key: 'fund_duration',
      render: (text: string) => text ? `${text}년` : '-',
      width: 100,
    },
    {
      title: '종료예정일',
      dataIndex: 'fund_end_date',
      key: 'fund_end_date',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
      width: 120,
    },
  ];

  if (!investor) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: 18 }}>{investor.name}</Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>{investor.type}</Tag>
          </div>
          <div>
            {!isEditing ? (
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                수정
              </Button>
            ) : (
              <div>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  style={{ marginRight: 8 }}
                >
                  저장
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancel}>
                  취소
                </Button>
              </div>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="기본정보" key="info">
              <Card>
                <Descriptions column={2} bordered>
                <Descriptions.Item label="투자사명" span={2}>
                  <Text strong>{investor.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="유형">
                  {investor.type}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  {isEditing ? (
                    <Form.Item name="is_active" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch 
                        checkedChildren="활성" 
                        unCheckedChildren="비활성"
                      />
                    </Form.Item>
                  ) : (
                    <Tag color={investor.is_active ? 'green' : 'red'}>
                      {investor.is_active ? '활성' : '비활성'}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="웹사이트" span={2}>
                  {isEditing ? (
                    <Form.Item name="website" style={{ margin: 0 }}>
                      <Input placeholder="웹사이트 URL을 입력하세요" />
                    </Form.Item>
                  ) : (
                    investor.website ? (
                      <a href={investor.website} target="_blank" rel="noopener noreferrer">
                        <GlobalOutlined /> {investor.website}
                      </a>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="연락처" span={2}>
                  {isEditing ? (
                    <Form.Item name="contact" style={{ margin: 0 }}>
                      <Input placeholder="연락처를 입력하세요" />
                    </Form.Item>
                  ) : (
                    investor.contact ? (
                      <Text copyable>{investor.contact}</Text>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                      )}
                </Descriptions.Item>
                <Descriptions.Item label="이메일" span={2}>
                  {isEditing ? (
                    <Form.Item name="email" style={{ margin: 0 }}>
                      <Input placeholder="이메일을 입력하세요" type="email" />
                    </Form.Item>
                  ) : (
                    investor.email ? (
                      <Text copyable>{investor.email}</Text>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="전문분야" span={2}>
                  {isEditing ? (
                    <Form.Item name="sectors" style={{ margin: 0 }}>
                      <Select
                        mode="tags"
                        placeholder="전문분야를 입력하세요"
                        style={{ width: '100%' }}
                        tokenSeparators={[',']}
                      />
                    </Form.Item>
                  ) : (
                    investor.sectors && investor.sectors.length > 0 ? (
                      <div>
                        {investor.sectors.map((sector, index) => (
                          <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                            {sector}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="설명" span={2}>
                  {isEditing ? (
                    <Form.Item name="description" style={{ margin: 0 }}>
                      <Input.TextArea 
                        rows={4} 
                        placeholder="투자사 설명을 입력하세요"
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  ) : (
                    investor.description ? (
                      <Paragraph>{investor.description}</Paragraph>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="등록일">
                  {new Date(investor.created_at).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
                <Descriptions.Item label="수정일">
                  {new Date(investor.updated_at).toLocaleDateString('ko-KR')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane tab="일반기사" key="general">
            <Spin spinning={articlesLoading}>
              <Table
                columns={articleColumns}
                dataSource={articles.general}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Spin>
          </TabPane>
          
          <TabPane tab="투자유치/펀드" key="funding">
            <Spin spinning={articlesLoading}>
              <Table
                columns={articleColumns}
                dataSource={articles.funding}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Spin>
          </TabPane>
          
          <TabPane tab="투자관련" key="investment">
            <Spin spinning={articlesLoading}>
              <Table
                columns={articleColumns}
                dataSource={articles.investment}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Spin>
          </TabPane>
          
        <TabPane tab="투자 이력" key="investment-history">
          <Spin spinning={investmentHistoryLoading}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">총 {investmentHistory.length}건의 투자 이력</Text>
            </div>
            <Table
              columns={investmentHistoryColumns}
              dataSource={investmentHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              locale={{ emptyText: '투자 이력이 없습니다.' }}
            />
          </Spin>
        </TabPane>
        
        <TabPane tab="펀드 이력" key="fund-history">
          <Spin spinning={fundHistoryLoading}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">총 {fundHistory.length}건의 펀드 이력</Text>
            </div>
            <Table
              columns={fundHistoryColumns}
              dataSource={fundHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              locale={{ emptyText: '펀드 이력이 없습니다.' }}
            />
          </Spin>
        </TabPane>
        </Tabs>
        </Form>
      </Spin>
      
      {/* 기사 상세정보 모달 */}
      {selectedArticle && (
        <ArticleDetailModal
          visible={articleModalVisible}
          article={selectedArticle}
          onClose={handleArticleModalClose}
        />
      )}

      {/* 투자 정보 입력 모달 */}
      {selectedArticle && investor && (
        <InvestmentInputModal
          visible={investmentModalVisible}
          article={selectedArticle}
          onCancel={handleInvestmentModalClose}
          onSave={() => {
            handleInvestmentModalClose();
            // 투자 이력 새로고침
            if (activeTab === 'investment-history') {
              fetchInvestmentHistory();
            }
          }}
          investorName={investor.name}
        />
      )}
    </Modal>
  );
};

export default InvestorDetailModal;
