import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Tag, Button, Spin, Card, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { articlesAPI, investmentsAPI } from '../services/api.ts';
import { Article } from '../types/index';
import InvestmentInputModal from './InvestmentInputModal.tsx';

interface ArticleDetailModalProps {
  visible: boolean;
  article: Article | null;
  onClose: () => void;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  visible,
  article,
  onClose
}) => {
  const [articleInvestments, setArticleInvestments] = useState<any[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [investmentModalVisible, setInvestmentModalVisible] = useState(false);

  useEffect(() => {
    if (visible && article) {
      fetchArticleInvestments();
    }
  }, [visible, article]);

  const fetchArticleInvestments = async () => {
    if (!article) return;
    
    try {
      setLoadingInvestments(true);
      const response = await articlesAPI.getArticleInvestments(article.id);
      setArticleInvestments(response.data.investments || []);
    } catch (error) {
      console.error('투자 정보 조회 실패:', error);
      message.error('투자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingInvestments(false);
    }
  };

  const showInvestmentModal = () => {
    setInvestmentModalVisible(true);
  };

  const handleInvestmentModalClose = () => {
    setInvestmentModalVisible(false);
    fetchArticleInvestments(); // 투자 정보 새로고침
  };

  const getStatusColor = (status: string) => {
    const statusMap = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      error: 'red'
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: '대기',
      processing: '처리중',
      completed: '완료',
      error: '오류'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (!article) return null;

  return (
    <>
      <Modal
        title="기사 상세 정보"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <Tabs
          items={[
            {
              key: 'content',
              label: '기사 내용',
              children: (
                <div>
                  <h3>{article.title}</h3>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">{article.source}</Tag>
                    <Tag color={getStatusColor(article.processing_status)}>
                      {getStatusText(article.processing_status)}
                    </Tag>
                    <span style={{ marginLeft: 16, color: '#666' }}>
                      수집일: {new Date(article.scraped_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>URL:</strong> 
                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                      {article.url}
                    </a>
                  </div>
                  <div>
                    <strong>내용:</strong>
                    <div style={{ 
                      marginTop: 8, 
                      maxHeight: 400, 
                      overflow: 'auto',
                      border: '1px solid #d9d9d9',
                      padding: 12,
                      borderRadius: 4,
                      backgroundColor: '#fafafa'
                    }}>
                      {article.content}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'investment',
              label: '투자 정보',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>이 기사에서 추출된 투자 정보</h4>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={showInvestmentModal}
                    >
                      투자 정보 추가
                    </Button>
                  </div>
                  {loadingInvestments ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 10 }}>투자 정보를 불러오는 중...</div>
                    </div>
                  ) : articleInvestments.length > 0 ? (
                    <div>
                      {articleInvestments.map((investment, index) => (
                        <Card key={index} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ marginBottom: 8 }}>
                                <strong>스타트업:</strong> {investment.startup_name}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>투자사:</strong> {investment.investor_name}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>라운드:</strong> {investment.round_type}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>금액:</strong> {investment.amount} {investment.currency}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>섹터:</strong> {investment.sector}
                              </div>
                              {investment.investment_date && (
                                <div style={{ marginBottom: 8 }}>
                                  <strong>투자일:</strong> {new Date(investment.investment_date).toLocaleDateString('ko-KR')}
                                </div>
                              )}
                              <div>
                                <Tag color="green">수동 입력</Tag>
                                <Tag color="blue">검증됨</Tag>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: 20, 
                      textAlign: 'center', 
                      color: '#999',
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8
                    }}>
                      아직 등록된 투자 정보가 없습니다.
                      <br />
                      위의 "투자 정보 추가" 버튼을 클릭하여 수동으로 입력해주세요.
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Modal>

      <InvestmentInputModal
        visible={investmentModalVisible}
        article={article}
        onCancel={handleInvestmentModalClose}
        onSave={(data) => {
          console.log('Investment data saved:', data);
          handleInvestmentModalClose();
          // 필요시 데이터 새로고침 로직 추가
        }}
      />
    </>
  );
};

export default ArticleDetailModal;
