import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Tag, Button, Spin, Card, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { articlesAPI, investmentsAPI, fundsAPI, otherActivitiesAPI } from '../services/api.ts';
import { Article } from '../types/index';
import InvestmentInputModal from './InvestmentInputModal.tsx';

interface ArticleDetailModalProps {
  visible: boolean;
  article: Article | null;
  onClose: () => void;
  onArticleUpdate?: () => void;  // 기사 목록 새로고침 콜백
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  visible,
  article,
  onClose,
  onArticleUpdate
}) => {
  const [articleData, setArticleData] = useState<{
    investments: any[];
    funds: any[];
    other_activities: any[];
  }>({
    investments: [],
    funds: [],
    other_activities: []
  });
  const [loadingData, setLoadingData] = useState(false);
  const [investmentModalVisible, setInvestmentModalVisible] = useState(false);

  useEffect(() => {
    if (visible && article) {
      fetchArticleData();
    }
  }, [visible, article]);

  const fetchArticleData = async () => {
    if (!article) return;
    
    try {
      setLoadingData(true);
      const response = await articlesAPI.getArticleInvestments(article.id);
      setArticleData({
        investments: response.data.investments || [],
        funds: response.data.funds || [],
        other_activities: response.data.other_activities || []
      });
    } catch (error) {
      console.error('정보 조회 실패:', error);
      message.error('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingData(false);
    }
  };

  const showInvestmentModal = () => {
    // 디버깅: article 객체 확인
    if (article) {
      console.log('🔍 ArticleDetailModal - article 객체:', {
        id: article.id,
        search_query: article.search_query,
        search_investor_id: article.search_investor_id,
        search_investor: article.search_investor
      });
    }
    setInvestmentModalVisible(true);
  };

  const handleInvestmentModalClose = () => {
    setInvestmentModalVisible(false);
    fetchArticleData(); // 정보 새로고침
  };

  const handleDeleteInvestment = async (investmentId: number) => {
    try {
      await investmentsAPI.deleteInvestment(investmentId);
      message.success('투자 정보가 삭제되었습니다.');
      fetchArticleData(); // 정보 새로고침
      if (onArticleUpdate) {
        onArticleUpdate(); // 기사 목록 새로고침
      }
    } catch (error) {
      console.error('투자 정보 삭제 실패:', error);
      message.error('투자 정보 삭제에 실패했습니다.');
    }
  };

  const handleDeleteFund = async (fundId: number) => {
    if (!article) {
      message.error('기사 정보가 없습니다.');
      return;
    }
    
    try {
      // 기사와 펀드의 연결만 해제 (펀드는 유지)
      await fundsAPI.unlinkFundFromArticle(article.id, fundId);
      message.success('펀드 연결이 해제되었습니다.');
      fetchArticleData(); // 정보 새로고침
      if (onArticleUpdate) {
        onArticleUpdate(); // 기사 목록 새로고침
      }
    } catch (error: any) {
      console.error('펀드 연결 해제 실패:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`펀드 연결 해제에 실패했습니다: ${errorMessage}`);
    }
  };

  const handleDeleteOtherActivity = async (activityId: number) => {
    try {
      await otherActivitiesAPI.deleteOtherActivity(activityId);
      message.success('기타 활동 정보가 삭제되었습니다.');
      fetchArticleData(); // 정보 새로고침
      if (onArticleUpdate) {
        onArticleUpdate(); // 기사 목록 새로고침
      }
    } catch (error) {
      console.error('기타 활동 정보 삭제 실패:', error);
      message.error('기타 활동 정보 삭제에 실패했습니다.');
    }
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
              label: '정보',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>이 기사에서 추출된 정보</h4>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={showInvestmentModal}
                    >
                      정보 추가
                    </Button>
                  </div>
                  {loadingData ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 10 }}>정보를 불러오는 중...</div>
                    </div>
                  ) : (
                    <div>
                      {/* 투자 정보 */}
                      {articleData.investments.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h5 style={{ marginBottom: 12, color: '#1890ff' }}>투자 정보</h5>
                          {articleData.investments.map((investment, index) => (
                            <Card key={`investment-${index}`} style={{ marginBottom: 12 }}>
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
                                <div>
                                  <Popconfirm
                                    title="투자 정보 삭제"
                                    description="이 투자 정보를 삭제하시겠습니까?"
                                    onConfirm={() => handleDeleteInvestment(investment.id)}
                                    okText="삭제"
                                    cancelText="취소"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button 
                                      type="text" 
                                      danger 
                                      icon={<DeleteOutlined />}
                                      size="small"
                                    >
                                      삭제
                                    </Button>
                                  </Popconfirm>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* 펀드 정보 */}
                      {articleData.funds.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h5 style={{ marginBottom: 12, color: '#52c41a' }}>펀드 정보</h5>
                          {articleData.funds.map((fund, index) => (
                            <Card key={`fund-${index}`} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: 8 }}>
                                    <strong>펀드명:</strong> {fund.fund_name}
                                  </div>
                                  {fund.fund_sector && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>섹터:</strong> {fund.fund_sector}
                                    </div>
                                  )}
                                  {fund.fund_amount && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>규모:</strong> {fund.fund_amount} {fund.fund_currency || 'KRW'}
                                    </div>
                                  )}
                                  {fund.fund_establishment_date && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>결성일:</strong> {new Date(fund.fund_establishment_date).toLocaleDateString('ko-KR')}
                                    </div>
                                  )}
                                  <div>
                                    <Tag color="green">펀드</Tag>
                                  </div>
                                </div>
                                <div>
                                  <Popconfirm
                                    title="펀드 연결 해제"
                                    description="이 기사와 펀드의 연결을 해제하시겠습니까? (펀드 정보는 유지됩니다)"
                                    onConfirm={() => handleDeleteFund(fund.id)}
                                    okText="연결 해제"
                                    cancelText="취소"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button 
                                      type="text" 
                                      danger 
                                      icon={<DeleteOutlined />}
                                      size="small"
                                    >
                                      연결 해제
                                    </Button>
                                  </Popconfirm>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* 기타활동 정보 */}
                      {articleData.other_activities.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h5 style={{ marginBottom: 12, color: '#722ed1' }}>기타활동 정보</h5>
                          {articleData.other_activities.map((activity, index) => (
                            <Card key={`activity-${index}`} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: 8 }}>
                                    <strong>활동 유형:</strong> {activity.event_type}
                                  </div>
                                  {activity.summary && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>요약:</strong> {activity.summary}
                                    </div>
                                  )}
                                  {activity.description && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>설명:</strong> {activity.description}
                                    </div>
                                  )}
                                  {activity.date && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>날짜:</strong> {new Date(activity.date).toLocaleDateString('ko-KR')}
                                    </div>
                                  )}
                                  {activity.related_company && (
                                    <div style={{ marginBottom: 8 }}>
                                      <strong>협력 기업:</strong> {activity.related_company}
                                    </div>
                                  )}
                                  <div>
                                    <Tag color="purple">기타활동</Tag>
                                  </div>
                                </div>
                                <div>
                                  <Popconfirm
                                    title="기타 활동 정보 삭제"
                                    description="이 기타 활동 정보를 삭제하시겠습니까?"
                                    onConfirm={() => handleDeleteOtherActivity(activity.id)}
                                    okText="삭제"
                                    cancelText="취소"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button 
                                      type="text" 
                                      danger 
                                      icon={<DeleteOutlined />}
                                      size="small"
                                    >
                                      삭제
                                    </Button>
                                  </Popconfirm>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* 정보가 없는 경우 */}
                      {articleData.investments.length === 0 && 
                       articleData.funds.length === 0 && 
                       articleData.other_activities.length === 0 && (
                        <div style={{ 
                          padding: 20, 
                          textAlign: 'center', 
                          color: '#999',
                          border: '2px dashed #d9d9d9',
                          borderRadius: 8
                        }}>
                          아직 등록된 정보가 없습니다.
                          <br />
                          위의 "정보 추가" 버튼을 클릭하여 수동으로 입력해주세요.
                        </div>
                      )}
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
        investorName={article?.search_investor?.name}
        searchInvestorId={article?.search_investor_id}
        onCancel={handleInvestmentModalClose}
        onSave={(data) => {
          console.log('Investment data saved:', data);
          handleInvestmentModalClose();
          // 기사 목록 새로고침
          if (onArticleUpdate) {
            onArticleUpdate();
          }
        }}
      />
    </>
  );
};

export default ArticleDetailModal;
