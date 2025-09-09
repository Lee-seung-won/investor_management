import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Input, Select, Tag, Space, Button, message, Spin, Checkbox, Row, Col, Modal, Progress } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import { articlesAPI, investmentsAPI, fundsAPI, investorsAPI } from '../services/api';
import { Article } from '../types';
import ArticleDetailModal from '../components/ArticleDetailModal';

const { Search } = Input;
const { Option } = Select;

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({
    search: '',
    is_processed: undefined as boolean | undefined,
    article_type: '',
    accurate_investment: false,
    accurate_fund: false,
  });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [articleTypes, setArticleTypes] = useState<{[key: number]: {type: string, color: string}}>({});
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsProgress, setStatsProgress] = useState(0);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      // 서버 사이드 필터링을 우선 사용하고, 필요시에만 클라이언트 사이드 필터링 적용
      const needsClientSideFiltering = filters.accurate_investment || filters.accurate_fund || filters.article_type;
      
      const serverParams: any = {
        skip: needsClientSideFiltering ? 0 : (pagination.current - 1) * pagination.pageSize,
        limit: needsClientSideFiltering ? 1000 : pagination.pageSize, // 클라이언트 필터링시에도 1000개로 제한
        search: filters.search || undefined
      };
      
      // include_article_types는 true일 때만 추가
      if (needsClientSideFiltering) {
        serverParams.include_article_types = true;
      }
      
      const response = await articlesAPI.getArticles(serverParams);
      let allArticles = response.data.articles;
      
      // 먼저 정확한 투자정보/펀드정보 필터링 (제목 기준)
      if (filters.accurate_investment) {
        allArticles = allArticles.filter((article: Article) => 
          isAccurateInvestmentArticle(article.title)
        );
      }

      if (filters.accurate_fund) {
        allArticles = allArticles.filter((article: Article) => 
          isAccurateFundArticle(article.title)
        );
      }
      
      // 기사 형태 정보 처리
      let types: {[key: number]: {type: string, color: string}} = {};
      
      if (response.data.article_types) {
        // 서버에서 기사 형태 정보를 받아온 경우
        types = response.data.article_types;
        setArticleTypes(types);
      } else {
        // 클라이언트에서 기사 형태를 계산해야 하는 경우 - 배치 처리로 성능 개선
        const batchSize = 10;
        for (let i = 0; i < allArticles.length; i += batchSize) {
          const batch = allArticles.slice(i, i + batchSize);
          const promises = batch.map(async (article: Article) => {
            try {
              const type = await getArticleType(article);
              return { id: article.id, type };
            } catch (error) {
              console.error(`기사 ${article.id} 형태 확인 실패:`, error);
              // 처리완료된 기사는 일반으로, 미처리 기사는 미분류로 분류
              const defaultType = article.is_processed 
                ? { type: '일반', color: 'default' }
                : { type: '미분류', color: 'orange' };
              return { id: article.id, type: defaultType };
            }
          });
          
          const results = await Promise.all(promises);
          results.forEach(({ id, type }: { id: number, type: any }) => {
            types[id] = type;
          });
        }
        setArticleTypes(types);
      }
      
      // 기사 형태별 필터링
      let filteredArticles = allArticles;
      if (filters.article_type) {
        filteredArticles = filteredArticles.filter((article: Article) => {
          const articleType = types[article.id];
          return articleType && articleType.type === filters.article_type;
        });
      }
      
      // 페이지네이션 처리
      if (needsClientSideFiltering) {
        // 클라이언트 사이드 필터링이 필요한 경우
        const startIndex = (pagination.current - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
        
        setArticles(paginatedArticles);
        setTotal(filteredArticles.length);
      } else {
        // 서버 사이드 페이지네이션 사용
        setArticles(filteredArticles);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('기사 목록 로딩 오류:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`기사 목록을 불러오는데 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };


  const handleProcessedChange = (value: boolean | undefined) => {
    setFilters({ ...filters, is_processed: value });
    setPagination({ ...pagination, current: 1 });
  };


  const handleArticleTypeChange = (value: string) => {
    setFilters({ ...filters, article_type: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleAccurateInvestmentChange = (checked: boolean) => {
    setFilters({ ...filters, accurate_investment: checked });
    setPagination({ ...pagination, current: 1 });
  };

  const handleAccurateFundChange = (checked: boolean) => {
    setFilters({ ...filters, accurate_fund: checked });
    setPagination({ ...pagination, current: 1 });
  };

  const showArticleDetail = (article: Article) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };


  // 정확한 투자정보 기사인지 제목 기준으로 판단
  const isAccurateInvestmentArticle = (title: string) => {
    // 투자 관련 키워드들
    const investmentKeywords = [
      '투자유치', '투자받', '투자받았', '투자받는', '투자받을',
      '시드', '시리즈', '라운드', 'A라운드', 'B라운드', 'C라운드',
      '투자금', '투자액', '투자규모', '투자금액',
      '벤처캐피털', , '피투자', '피투자사',
      '투자사', '투자기관', '투자유치', '투자성공',
      '펀딩', '펀딩받', '펀딩받았', '펀딩받는',
      '자금조달', '자금유치', '자금투입',
      '투자유치', '투자성공', '투자완료'
    ];

    // 투자 관련 키워드가 포함되어 있는지 확인
    const hasInvestmentKeyword = investmentKeywords.some(keyword => 
      keyword && title.toLowerCase().includes(keyword.toLowerCase())
    );

    return hasInvestmentKeyword;
  };

  // 정확한 펀드정보 기사인지 제목 기준으로 판단
  const isAccurateFundArticle = (title: string) => {
    // 펀드 관련 키워드들
    const fundKeywords = [
      '펀드 결성', '펀드 설립', '펀드 출시', '펀드 런칭',
      '펀드 조성', '펀드 모집', '펀드 운용', '펀드 관리', 
      '투자펀드', '자산운용', '자산관리',
      '펀드매니저', '펀드운용사', '펀드사',
      '펀드 규모', '펀드 규모', '펀드 조성',
      '펀드 투자', '펀드 투자처', '펀드 투자처',
      '펀드 성과', '펀드 수익', '펀드 운용성과',
      '펀드 포트폴리오', '펀드 투자처', '펀드 투자처', '펀드', '펀딩'
    ];
    
    // 펀드 관련 키워드가 포함되어 있는지 확인
    const hasFundKeyword = fundKeywords.some(keyword => 
      keyword && title.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return hasFundKeyword;
  };

  // 통계 데이터 가져오기
  const fetchStatsData = async () => {
    try {
      setStatsLoading(true);
      
      // 투자사 목록 가져오기
      const investorsResponse = await investorsAPI.getInvestors({ limit: 1000 });
      const investors = investorsResponse.data.investors;
      
      // 각 투자사별 통계 계산 (배치 처리로 성능 개선)
      const batchSize = 10; // 한 번에 10개씩 처리
      const investorStats = [];
      
      for (let i = 0; i < investors.length; i += batchSize) {
        const batch = investors.slice(i, i + batchSize);
        const batchStats = await Promise.all(
          batch.map(async (investor: any) => {
            try {
              // 투자사별 기사 수
              const articlesResponse = await investorsAPI.getInvestorArticles(investor.id, {});
              const totalArticles = articlesResponse.data.total;
              
              // 투자사별 투자 이력 수
              const investmentsResponse = await investorsAPI.getInvestorInvestmentHistory(investor.id, {});
              const totalInvestments = investmentsResponse.data.total;
              
              // 투자사별 펀드 이력 수
              const fundsResponse = await investorsAPI.getInvestorFundHistory(investor.id, {});
              const totalFunds = fundsResponse.data.total;
              
              return {
                id: investor.id,
                name: investor.name,
                type: investor.type,
                sectors: investor.sectors || [],
                totalArticles,
                totalInvestments,
                totalFunds,
                isActive: investor.is_active
              };
            } catch (error) {
              console.warn(`투자사 ${investor.name} 통계 조회 실패:`, error);
              return {
                id: investor.id,
                name: investor.name,
                type: investor.type,
                sectors: investor.sectors || [],
                totalArticles: 0,
                totalInvestments: 0,
                totalFunds: 0,
                isActive: investor.is_active
              };
            }
          })
        );
        investorStats.push(...batchStats);
        
        // 진행 상황 표시
        const progress = Math.round(((i + batchSize) / investors.length) * 100);
        setStatsProgress(Math.min(progress, 100));
        console.log(`통계 수집 진행률: ${Math.min(progress, 100)}%`);
      }
      
      // 전체 통계 계산 (실제 데이터베이스에서 직접 조회)
      const totalInvestors = investorStats.length;
      const activeInvestors = investorStats.filter(stat => stat.isActive).length;
      
      // 실제 전체 기사 수 조회
      const articlesResponse = await articlesAPI.getArticles({ limit: 1 });
      const totalArticles = articlesResponse.data.total;
      
      // 실제 전체 투자 정보 수 조회
      const investmentsResponse = await investmentsAPI.getInvestments({ limit: 1 });
      const totalInvestments = investmentsResponse.data.total;
      
      // 실제 전체 펀드 정보 수 조회
      const fundsResponse = await fundsAPI.getFunds({ limit: 1 });
      const totalFunds = fundsResponse.data.total;
      
      // 섹터별 통계
      const sectorStats: {[key: string]: number} = {};
      investorStats.forEach(stat => {
        stat.sectors.forEach((sector: string) => {
          sectorStats[sector] = (sectorStats[sector] || 0) + 1;
        });
      });
      
      // 투자사 유형별 통계
      const typeStats: {[key: string]: number} = {};
      investorStats.forEach(stat => {
        typeStats[stat.type] = (typeStats[stat.type] || 0) + 1;
      });
      
      // 기사 수 분포 히스토그램 데이터 생성
      const articleCountHistogram = {
        '0개': 0,
        '1-5개': 0,
        '6-10개': 0,
        '11-20개': 0,
        '21-50개': 0,
        '51-100개': 0,
        '100개 이상': 0
      };
      
      investorStats.forEach(stat => {
        const count = stat.totalArticles;
        if (count === 0) {
          articleCountHistogram['0개']++;
        } else if (count <= 5) {
          articleCountHistogram['1-5개']++;
        } else if (count <= 10) {
          articleCountHistogram['6-10개']++;
        } else if (count <= 20) {
          articleCountHistogram['11-20개']++;
        } else if (count <= 50) {
          articleCountHistogram['21-50개']++;
        } else if (count <= 100) {
          articleCountHistogram['51-100개']++;
        } else {
          articleCountHistogram['100개 이상']++;
        }
      });
      
      setStatsData({
        overview: {
          totalInvestors,
          activeInvestors,
          totalArticles,
          totalInvestments,
          totalFunds
        },
        investorStats: investorStats.sort((a, b) => b.totalArticles - a.totalArticles),
        sectorStats: Object.entries(sectorStats).sort(([,a], [,b]) => b - a),
        typeStats: Object.entries(typeStats).sort(([,a], [,b]) => b - a),
        articleCountHistogram: Object.entries(articleCountHistogram)
      });
      
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
      message.error('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setStatsLoading(false);
    }
  };

  const getArticleType = async (article: Article) => {
    try {
      // 투자정보 확인
      try {
        const investmentsResponse = await investmentsAPI.getArticleInvestments(article.id);
        if (investmentsResponse.data.investments && investmentsResponse.data.investments.length > 0) {
          return { type: '투자정보', color: 'blue' };
        }
      } catch (investmentError) {
        console.warn(`기사 ${article.id} 투자정보 확인 실패:`, investmentError);
      }

      // 펀드정보 확인
      try {
        const fundsResponse = await fundsAPI.getArticleFunds(article.id);
        if (fundsResponse.data && fundsResponse.data.length > 0) {
          return { type: '펀드 결성', color: 'purple' };
        }
      } catch (fundError) {
        console.warn(`기사 ${article.id} 펀드정보 확인 실패:`, fundError);
      }

      // 처리 완료된 기사이지만 투자정보나 펀드정보가 없는 경우
      if (article.is_processed) {
        return { type: '일반', color: 'default' };
      }

      // 처리되지 않은 기사
      return { type: '미분류', color: 'orange' };
    } catch (error) {
      console.error('기사 형태 확인 중 오류:', error);
      // 처리완료된 기사는 일반으로, 미처리 기사는 미분류로 분류
      if (article.is_processed) {
        return { type: '일반', color: 'default' };
      } else {
        return { type: '미분류', color: 'orange' };
      }
    }
  };



  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <div>
          <div style={{ 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 400
          }}>
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.source}
          </div>
        </div>
      ),
    },
    {
      title: '기사 형태',
      key: 'article_type',
      width: 120,
      render: (text: any, record: Article) => {
        const articleType = articleTypes[record.id];
        
        if (!articleType) {
          return <Spin size="small" />;
        }
        
        return (
          <Tag color={articleType.color}>
            {articleType.type}
          </Tag>
        );
      },
    },
    {
      title: '수집일',
      dataIndex: 'scraped_at',
      key: 'scraped_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      render: (text: any, record: Article) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showArticleDetail(record)}
        >
          보기
        </Button>
      ),
    },
  ];

  // 통계 모달 열기
  const showStatsModal = () => {
    setStatsModalVisible(true);
    fetchStatsData();
  };

  // 통계 모달 닫기
  const hideStatsModal = () => {
    setStatsModalVisible(false);
    setStatsData(null);
    setStatsProgress(0);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space wrap>
              <Search
                placeholder="제목 또는 내용 검색"
                allowClear
                style={{ width: 250 }}
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="처리 여부"
                allowClear
                style={{ width: 120 }}
                onChange={handleProcessedChange}
              >
                <Option value={true}>처리완료</Option>
                <Option value={false}>미처리</Option>
              </Select>
              <Select
                placeholder="기사 형태"
                allowClear
                style={{ width: 120 }}
                onChange={handleArticleTypeChange}
              >
                <Option value="투자정보">투자정보</Option>
                <Option value="펀드 결성">펀드 결성</Option>
                <Option value="일반">일반</Option>
                <Option value="미분류">미분류</Option>
                <Option value="확인불가">확인불가</Option>
              </Select>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchArticles}
                loading={loading}
              >
                새로고침
              </Button>
              <Button 
                icon={<BarChartOutlined />} 
                onClick={showStatsModal}
                type="primary"
              >
                통계
              </Button>
            </Space>
          </Col>
          <Col span={24}>
            <Space>
              <Checkbox
                checked={filters.accurate_investment}
                onChange={(e) => handleAccurateInvestmentChange(e.target.checked)}
              >
                더 정확한 투자정보 기사
              </Checkbox>
              <Checkbox
                checked={filters.accurate_fund}
                onChange={(e) => handleAccurateFundChange(e.target.checked)}
              >
                더 정확한 펀드정보 기사
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={articles}
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
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <ArticleDetailModal
        visible={modalVisible}
        article={selectedArticle}
        onClose={() => setModalVisible(false)}
      />

      {/* 통계 모달 */}
      <Modal
        title="투자사 정보 불균형 통계"
        visible={statsModalVisible}
        onCancel={hideStatsModal}
        width={1200}
        footer={[
          <Button key="close" onClick={hideStatsModal}>
            닫기
          </Button>
        ]}
      >
        <Spin spinning={statsLoading} tip={statsLoading ? `데이터 수집 중... ${statsProgress}%` : undefined}>
          {statsLoading && !statsData && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div style={{ marginBottom: 16 }}>투자사 통계 데이터를 수집하고 있습니다...</div>
              <div style={{ width: '300px', margin: '0 auto' }}>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${statsProgress}%`,
                    height: '100%',
                    backgroundColor: '#1890ff',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
                  {statsProgress}% 완료
                </div>
              </div>
            </div>
          )}
          {statsData && (
            <div>
              {/* 전체 통계 */}
              <Card title="전체 통계" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {statsData.overview.totalInvestors || 0}
                      </div>
                      <div>총 투자사 수</div>
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {statsData.overview.activeInvestors || 0}
                      </div>
                      <div>활성 투자사</div>
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {statsData.overview.totalArticles || 0}
                      </div>
                      <div>총 기사 수</div>
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                        {statsData.overview.totalInvestments || 0}
                      </div>
                      <div>총 투자 정보</div>
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }}>
                        {statsData.overview.totalFunds || 0}
                      </div>
                      <div>총 펀드 정보</div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 투자사별 기사 수 TOP 10 */}
              <Card title="투자사별 기사 수 TOP 10" style={{ marginBottom: 16 }}>
                <Table
                  dataSource={statsData.investorStats.slice(0, 10)}
                  columns={[
                    {
                      title: '순위',
                      dataIndex: 'index',
                      key: 'index',
                      width: 60,
                      render: (text: any, record: any, index: number) => index + 1,
                    },
                    {
                      title: '투자사명',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name: string, record: any) => (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.type} | {record.sectors.join(', ')}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: '기사 수',
                      dataIndex: 'totalArticles',
                      key: 'totalArticles',
                      width: 80,
                      render: (count: number) => (
                        <Tag color={count > 50 ? 'red' : count > 20 ? 'orange' : 'green'}>
                          {count}개
                        </Tag>
                      ),
                    },
                    {
                      title: '투자 정보',
                      dataIndex: 'totalInvestments',
                      key: 'totalInvestments',
                      width: 80,
                      render: (count: number) => count > 0 ? `${count}개` : '-',
                    },
                    {
                      title: '펀드 정보',
                      dataIndex: 'totalFunds',
                      key: 'totalFunds',
                      width: 80,
                      render: (count: number) => count > 0 ? `${count}개` : '-',
                    },
                    {
                      title: '상태',
                      dataIndex: 'isActive',
                      key: 'isActive',
                      width: 80,
                      render: (isActive: boolean) => (
                        <Tag color={isActive ? 'green' : 'red'}>
                          {isActive ? '활성' : '비활성'}
                        </Tag>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>

              {/* 기사 수 분포 히스토그램 */}
              <Card title="투자사별 기사 수 분포" style={{ marginBottom: 16 }}>
                <div style={{ padding: '20px 0' }}>
                  {statsData.articleCountHistogram.map(([range, count]: [string, number]) => {
                    const maxCount = Math.max(...statsData.articleCountHistogram.map(([,c]: [string, number]) => c));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={range} style={{ marginBottom: '16px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontWeight: 'bold', minWidth: '80px' }}>{range}</span>
                          <span style={{ color: '#666', fontSize: '14px' }}>{count === 0 ? '0개 투자사' : `${count}개 투자사`}</span>
                        </div>
                        <Progress 
                          percent={percentage} 
                          showInfo={false}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                          style={{ marginBottom: '8px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 섹터별 분포 */}
              <Card title="섹터별 투자사 분포" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  {statsData.sectorStats.slice(0, 8).map(([sector, count]: [string, number]) => (
                    <Col span={6} key={sector} style={{ marginBottom: 8 }}>
                      <div style={{ 
                        padding: '8px 12px', 
                        background: '#f5f5f5', 
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>{sector}</div>
                        <div style={{ color: '#666' }}>{count}개 투자사</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 투자사 유형별 분포 */}
              <Card title="투자사 유형별 분포">
                <Row gutter={16}>
                  {statsData.typeStats.map(([type, count]: [string, number]) => (
                    <Col span={6} key={type} style={{ marginBottom: 8 }}>
                      <div style={{ 
                        padding: '8px 12px', 
                        background: '#e6f7ff', 
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>{type}</div>
                        <div style={{ color: '#666' }}>{count}개</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default Articles;
