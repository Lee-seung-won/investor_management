import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Input, Tag, Space, Typography, Row, Col, message, List, Statistic, Badge, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, SyncOutlined, LockOutlined } from '@ant-design/icons';
import { reportsAPI, fundsAPI, articlesAPI } from '../services/api.ts';
import { usePermissions } from '../utils/permissions';

interface InvestorWithCount {
  investor_id: number;
  investor_name: string;
  fund_count: number;
}

const Funds: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [investors, setInvestors] = useState<InvestorWithCount[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [investorSearchText, setInvestorSearchText] = useState('');
  const [funds, setFunds] = useState<any[]>([]);
  const [fundAgeDistribution, setFundAgeDistribution] = useState<any>({});
  const [reportLoading, setReportLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<any[]>([]);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // 활성화된 엑셀러레이터 목록 가져오기 (보고서가 있는 투자자만)
  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getInvestorsWithReports({ has_report: true, limit: 1000 });
      if (response.data && response.data.investors) {
        const investorsWithCount = response.data.investors.map((inv: any) => ({
          investor_id: inv.id,
          investor_name: inv.name,
          fund_count: inv.fund_count || 0,
        }));
        // 펀드 개수순으로 정렬 (내림차순)
        investorsWithCount.sort((a, b) => b.fund_count - a.fund_count);
        
        setInvestors(investorsWithCount);
        // 첫 번째 투자사를 자동 선택 (아직 선택된 투자사가 없는 경우만)
        if (investorsWithCount.length > 0 && selectedInvestorId === null) {
          setSelectedInvestorId(investorsWithCount[0].investor_id);
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


  // 선택한 투자사의 Fund 테이블에서 펀드 정보 가져오기
  const fetchFunds = useCallback(async () => {
    if (!selectedInvestorId) {
      setFunds([]);
      setFundAgeDistribution({});
      return;
    }

    setReportLoading(true);
    try {
      // 모든 source의 펀드 가져오기 (diaa와 article 모두)
      const response = await fundsAPI.getFunds({
        investor_id: selectedInvestorId,
        limit: 1000
      });
      
      if (response.data) {
        // API 응답 구조 확인
        console.log('API 응답:', response.data);
        const fundsData = response.data.funds || response.data || [];
        console.log('펀드 데이터:', fundsData.length, '개');
        
        if (!Array.isArray(fundsData)) {
          console.error('펀드 데이터가 배열이 아닙니다:', fundsData);
          setFunds([]);
          setFundAgeDistribution({});
          return;
        }
        
        // 등록일 최신순으로 정렬
        const sortedFunds = [...fundsData].sort((a, b) => {
          const dateA = a.registration_date ? new Date(a.registration_date).getTime() : 0;
          const dateB = b.registration_date ? new Date(b.registration_date).getTime() : 0;
          return dateB - dateA; // 최신순
        });
        setFunds(sortedFunds);
        
        // 펀드연령별 분포 계산
        const distribution: any = { '0-1yr': 0, '1-2yr': 0, '2-3yr': 0, '3-4yr': 0, '4-5yr': 0 };
        const today = new Date();
        
        sortedFunds.forEach((fund: any) => {
          if (fund.registration_date) {
            const regDate = new Date(fund.registration_date);
            const years = (today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
            
            if (years < 1) distribution['0-1yr']++;
            else if (years < 2) distribution['1-2yr']++;
            else if (years < 3) distribution['2-3yr']++;
            else if (years < 4) distribution['3-4yr']++;
            else if (years < 5) distribution['4-5yr']++;
          }
        });
        
        setFundAgeDistribution(distribution);
      } else {
        setFunds([]);
        setFundAgeDistribution({});
      }
    } catch (error: any) {
      console.error('펀드 정보 조회 실패:', error);
      message.error('펀드 정보를 불러오는데 실패했습니다.');
      setFunds([]);
      setFundAgeDistribution({});
    } finally {
      setReportLoading(false);
    }
  }, [selectedInvestorId]);

  // 모든 엑셀러레이터의 펀드 정보 갱신 (DIAA 보고서에서 동기화)
  const handleSyncAllFunds = useCallback(async () => {
    if (!hasPermission('refresh_all_funds')) {
      message.warning('전체펀드정보 갱신 권한이 없습니다.');
      return;
    }
    setSyncing(true);
    try {
      const response = await reportsAPI.syncAllFundsFromReports();
      if (response.data) {
        const { total_investors, total_created, total_deleted } = response.data;
        message.success(
          `전체 펀드 정보 갱신 완료: ${total_investors}개 투자사, 생성 ${total_created}개, 삭제 ${total_deleted}개`
        );
        // 갱신 후 목록 새로고침
        await fetchFunds();
      }
    } catch (error: any) {
      console.error('펀드 정보 갱신 실패:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`펀드 정보 갱신에 실패했습니다: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  }, [fetchFunds]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleInvestorClick = (investorId: number) => {
    setSelectedInvestorId(investorId);
  };

  // 뉴스 기사 정보 가져오기 (여러 기사 조회)
  const handleFundNameClick = async (fund: any) => {
    if (fund.id) {
      try {
        setLoadingArticles(true);
        const response = await fundsAPI.getFundArticles(fund.id);
        if (response.data) {
          const articles = response.data.articles || [];
          // 기사가 있는 경우에만 모달 표시
          if (articles.length > 0) {
            setSelectedArticles(articles);
            // API 응답에서 fund_sectors 가져오기
            setSelectedFund({
              ...fund,
              fund_sectors: response.data.fund_sectors
            });
            setArticleModalVisible(true);
          } else {
            message.info('이 펀드에 연결된 뉴스 기사가 없습니다.');
          }
        }
      } catch (error: any) {
        console.error('기사 정보 조회 실패:', error);
        message.error('기사 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoadingArticles(false);
      }
    }
  };

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
                            count={investor.fund_count} 
                            style={{ backgroundColor: investor.fund_count > 0 ? '#1890ff' : '#d9d9d9' }}
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

        {/* 오른쪽: 조합결성현황 */}
        <Col span={18}>
          <Card 
            title={selectedInvestor ? `${selectedInvestor.investor_name}의 조합결성현황` : '조합결성현황'}
            extra={
              <Space>
                <Button 
                  icon={hasPermission('refresh_all_funds') ? <SyncOutlined /> : <LockOutlined />}
                  onClick={handleSyncAllFunds}
                  loading={syncing}
                  type="primary"
                  disabled={!hasPermission('refresh_all_funds')}
                  style={!hasPermission('refresh_all_funds') ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                >
                  전체 펀드정보 갱신하기
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchFunds}
                  loading={reportLoading}
                >
                  새로고침
                </Button>
              </Space>
            }
            style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto', padding: '24px' }}
          >
            {selectedInvestorId ? (
              funds.length > 0 ? (
                <>
                  {/* 펀드연령별 분포 통계 */}
                  {Object.keys(fundAgeDistribution).length > 0 && (
                    <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
                      <Typography.Title level={5} style={{ marginBottom: 12 }}>
                        펀드연령별 분포
                      </Typography.Title>
                      <Row gutter={16}>
                        <Col span={4}>
                          <Statistic
                            title="0-1년"
                            value={fundAgeDistribution['0-1yr'] || 0}
                            valueStyle={{ fontSize: 18 }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="1-2년"
                            value={fundAgeDistribution['1-2yr'] || 0}
                            valueStyle={{ fontSize: 18 }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="2-3년"
                            value={fundAgeDistribution['2-3yr'] || 0}
                            valueStyle={{ fontSize: 18 }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="3-4년"
                            value={fundAgeDistribution['3-4yr'] || 0}
                            valueStyle={{ fontSize: 18 }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="4-5년"
                            value={fundAgeDistribution['4-5yr'] || 0}
                            valueStyle={{ fontSize: 18 }}
                          />
                        </Col>
                        <Col span={4}>
                          <Statistic
                            title="총 펀드 수"
                            value={funds.length}
                            valueStyle={{ fontSize: 18, color: '#1890ff' }}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                  
                  <Table
                    dataSource={funds}
                    rowKey={(record) => record.id || record.fund_name}
                    pagination={false}
                    scroll={{ y: 'calc(100vh - 550px)', x: 1000 }}
                    defaultSortOrder={{ columnKey: 'registration_date', order: 'descend' }}
                    columns={[
                      {
                        title: '조합명',
                        dataIndex: 'fund_name',
                        key: 'fund_name',
                        width: '25%',
                        render: (text: string, record: any) => {
                          // 연결된 기사가 있는 경우에만 🗞️ 표시
                          const hasArticles = record.article_count > 0;
                          return (
                            <Space>
                              <Typography.Text 
                                strong 
                                style={{ 
                                  color: hasArticles ? '#1890ff' : 'inherit',
                                  cursor: hasArticles ? 'pointer' : 'default'
                                }}
                                onClick={hasArticles ? () => handleFundNameClick(record) : undefined}
                              >
                                {text}
                              </Typography.Text>
                              {hasArticles && (
                                <span 
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleFundNameClick(record)}
                                  title="연결된 뉴스 기사 확인"
                                >
                                  🗞️
                                </span>
                              )}
                            </Space>
                          );
                        },
                      },
                      {
                        title: '등록일',
                        dataIndex: 'registration_date',
                        key: 'registration_date',
                        width: '15%',
                        sorter: (a: any, b: any) => {
                          const dateA = a.registration_date ? new Date(a.registration_date).getTime() : 0;
                          const dateB = b.registration_date ? new Date(b.registration_date).getTime() : 0;
                          return dateB - dateA; // 최신순 (내림차순)
                        },
                        defaultSortOrder: 'descend' as const,
                        sortDirections: ['descend', 'ascend'],
                        render: (date: string) => (
                          date ? new Date(date).toLocaleDateString('ko-KR') : '-'
                        ),
                      },
                      {
                        title: '말소예정일',
                        dataIndex: 'deletion_due_date',
                        key: 'deletion_due_date',
                        width: '15%',
                        render: (date: string) => {
                          if (!date) return '-';
                          const dueDate = new Date(date);
                          const today = new Date();
                          const isPast = dueDate < today;
                          return (
                            <span style={{ color: isPast ? '#ff4d4f' : '#52c41a' }}>
                              {dueDate.toLocaleDateString('ko-KR')}
                              {isPast && <Tag color="red" style={{ marginLeft: 8 }}>만료</Tag>}
                            </span>
                          );
                        },
                      },
                      {
                        title: '대표펀드매니저',
                        dataIndex: 'representative_manager',
                        key: 'representative_manager',
                        width: '22%',
                        render: (text: string) => text || '-',
                      },
                      {
                        title: '펀드매니저',
                        dataIndex: 'fund_manager',
                        key: 'fund_manager',
                        width: '23%',
                        render: (text: string) => text || '-',
                      },
                    ]}
                  />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                  {reportLoading ? '로딩 중...' : '펀드 정보가 없습니다. "펀드정보 갱신하기" 버튼을 클릭하여 DIAA 보고서에서 펀드 정보를 가져오세요.'}
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                왼쪽에서 엑셀러레이터를 선택하세요
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 뉴스 기사 모달 */}
      <Modal
        title={`연결된 뉴스 기사${selectedFund ? ` - ${selectedFund.fund_name}` : ''}`}
        open={articleModalVisible}
        onCancel={() => {
          setArticleModalVisible(false);
          setSelectedArticles([]);
          setSelectedFund(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setArticleModalVisible(false);
            setSelectedArticles([]);
            setSelectedFund(null);
          }}>
            닫기
          </Button>
        ]}
        width={900}
      >
        {loadingArticles ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Typography.Text>기사 정보를 불러오는 중...</Typography.Text>
          </div>
        ) : selectedArticles.length > 0 ? (
          <div>
            {selectedFund?.fund_sectors && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Typography.Text strong>투자 섹터: </Typography.Text>
                <Typography.Text>{selectedFund.fund_sectors}</Typography.Text>
              </div>
            )}
            
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              연결된 기사 ({selectedArticles.length}개)
            </Typography.Title>
            
            <List
              dataSource={selectedArticles}
              renderItem={(article: any, index: number) => (
                <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {index + 1}. {article.title}
                      </Typography.Text>
                    </div>
                    
                    <div style={{ marginBottom: 8 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.url}
                        </a>
                      </Typography.Text>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {article.source && (
                        <Tag color="blue">{article.source}</Tag>
                      )}
                      {article.published_at && (
                        <Tag>
                          발행일: {new Date(article.published_at).toLocaleDateString('ko-KR')}
                        </Tag>
                      )}
                      {article.sector && (
                        <Tag color="purple">섹터: {article.sector}</Tag>
                      )}
                      {article.search_query && (
                        <Tag color="green">검색쿼리: {article.search_query}</Tag>
                      )}
                      {article.type && (
                        <Tag color={article.type === 'fund' ? 'green' : article.type === 'investment' ? 'blue' : 'default'}>
                          {article.type}
                        </Tag>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            연결된 뉴스 기사가 없습니다.
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Funds;
