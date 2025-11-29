import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Input, Button, Row, Col, List, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { articlesAPI, investorsAPI } from '../services/api';
import { Article } from '../types';
import ArticleDetailModal from '../components/ArticleDetailModal';
import './Articles.css';

interface FundArticle extends Article {
  fund?: {
    id: number;
    fund_name: string;
    investor_id: number;
    registration_date?: string;
    deletion_due_date?: string;
  };
  matched_fund_names?: string[];
}

interface InvestorWithCount {
  investor_id: number;
  investor_name: string;
  fund_article_count: number;
}

const FundArticles: React.FC = () => {
  const [investors, setInvestors] = useState<InvestorWithCount[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [articles, setArticles] = useState<FundArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [investorSearchText, setInvestorSearchText] = useState('');

  // 펀드 기사가 있는 엑셀러레이터 목록 가져오기
  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await investorsAPI.getInvestorFundArticleCounts({ is_active: true });
      if (response.data && response.data.investors) {
        setInvestors(response.data.investors);
        // 첫 번째 투자사를 자동 선택 (아직 선택된 투자사가 없는 경우만)
        if (response.data.investors.length > 0 && selectedInvestorId === null) {
          setSelectedInvestorId(response.data.investors[0].investor_id);
        }
      }
    } catch (error) {
      console.error('투자사 목록 로딩 오류:', error);
      message.error('투자사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 선택한 투자사의 펀드 기사 목록 가져오기
  const fetchArticles = useCallback(async () => {
    if (!selectedInvestorId) {
      setArticles([]);
      setTotal(0);
      return;
    }

    try {
      setArticlesLoading(true);
      const params: any = {
        skip: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        search_investor_id: selectedInvestorId,
      };

      const response = await articlesAPI.getFundArticles(params);
      if (response.data) {
        setArticles(response.data.articles || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('펀드 기사 목록 로딩 오류:', error);
      message.error('펀드 기사 목록을 불러오는데 실패했습니다.');
    } finally {
      setArticlesLoading(false);
    }
  }, [selectedInvestorId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleInvestorClick = (investorId: number) => {
    setSelectedInvestorId(investorId);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };


  const handleArticleClick = (article: FundArticle) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedArticle(null);
  };

  const handleArticleUpdate = () => {
    fetchArticles();
  };

  const selectedInvestor = investors.find(inv => inv.investor_id === selectedInvestorId);

  // 엑셀러레이터 목록 필터링
  const filteredInvestors = investors.filter(investor =>
    investor.investor_name.toLowerCase().includes(investorSearchText.toLowerCase())
  );

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
      ellipsis: true,
      render: (text: string, record: FundArticle) => (
        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            handleArticleClick(record);
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '발행일',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString('ko-KR');
        } catch {
          return date;
        }
      },
    },
    {
      title: '수집일',
      dataIndex: 'scraped_at',
      key: 'scraped_at',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString('ko-KR');
        } catch {
          return date;
        }
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_: any, record: FundArticle) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleArticleClick(record)}
        >
          보기
        </Button>
      ),
    },
  ];

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
                            count={investor.fund_article_count} 
                            style={{ backgroundColor: investor.fund_article_count > 0 ? '#1890ff' : '#d9d9d9' }}
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

        {/* 오른쪽: 펀드 기사 목록 */}
        <Col span={18}>
          <Card
            title={selectedInvestor ? `${selectedInvestor.investor_name}의 펀드 기사` : '펀드 기사'}
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchArticles}
                loading={articlesLoading}
              >
                새로고침
              </Button>
            }
            style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '24px' }}
          >
            {selectedInvestorId ? (
              <Table
                columns={columns}
                dataSource={articles}
                rowKey="id"
                loading={articlesLoading}
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
                scroll={{ x: 1200, y: 'calc(100vh - 300px)' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                엑셀러레이터를 선택해주세요.
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          visible={modalVisible}
          onClose={handleModalClose}
          onArticleUpdate={handleArticleUpdate}
        />
      )}
    </div>
  );
};

export default FundArticles;
