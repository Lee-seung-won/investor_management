import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  message, 
  Space, 
  Tag, 
  Progress, 
  Row, 
  Col, 
  Statistic,
  Modal,
  Typography,
  Select,
  Spin,
  Result
} from 'antd';
import { 
  DeleteOutlined, 
  TagOutlined, 
  BarChartOutlined,
  ReloadOutlined,
  DownloadOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { labelingAPI } from '../services/api.ts';
import { usePermissions } from '../utils/permissions';
import { useHistory } from 'react-router-dom';

const { Option } = Select;
const { Text, Title } = Typography;

interface Article {
  id: number;
  title: string;
  url: string;
  scraped_at: string;
}

interface Token {
  token_index: number;
  token_text: string;
  label: string;
  confidence: number;
  labeled_by: string;
}

interface Sentence {
  sentence_index: number;
  sentence_text: string;
  tokens: Token[];
}

interface LabelingStats {
  total_articles: number;
  labeled_articles: number;
  total_tokens: number;
  label_distribution: Record<string, number>;
  progress_percentage: number;
}

const LABEL_COLORS = {
  'O': 'default',
  'B-STARTUP': 'blue',
  'I-STARTUP': 'cyan',
  'B-INVESTOR': 'green',
  'I-INVESTOR': 'lime',
  'B-AMOUNT': 'orange',
  'I-AMOUNT': 'gold',
  'B-ROUND': 'purple',
  'I-ROUND': 'magenta',
  'B-SECTOR': 'red',
  'I-SECTOR': 'pink'
};

const LABEL_OPTIONS = [
  { value: 'O', label: 'O (기타)', color: 'default' },
  { value: 'B-STARTUP', label: 'B-STARTUP (스타트업 시작)', color: 'blue' },
  { value: 'I-STARTUP', label: 'I-STARTUP (스타트업 연속)', color: 'cyan' },
  { value: 'B-INVESTOR', label: 'B-INVESTOR (투자사 시작)', color: 'green' },
  { value: 'I-INVESTOR', label: 'I-INVESTOR (투자사 연속)', color: 'lime' },
  { value: 'B-AMOUNT', label: 'B-AMOUNT (투자금액 시작)', color: 'orange' },
  { value: 'I-AMOUNT', label: 'I-AMOUNT (투자금액 연속)', color: 'gold' },
  { value: 'B-ROUND', label: 'B-ROUND (투자라운드 시작)', color: 'purple' },
  { value: 'I-ROUND', label: 'I-ROUND (투자라운드 연속)', color: 'magenta' },
  { value: 'B-SECTOR', label: 'B-SECTOR (섹터 시작)', color: 'red' },
  { value: 'I-SECTOR', label: 'I-SECTOR (섹터 연속)', color: 'pink' }
];

const Labeling: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LabelingStats | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [labelingModalVisible, setLabelingModalVisible] = useState(false);
  const [labelingLoading, setLabelingLoading] = useState(false);
  const [editingToken, setEditingToken] = useState<{sentenceIndex: number, tokenIndex: number} | null>(null);

  // 기사 목록 조회
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await labelingAPI.getArticles({ limit: 50 });
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('기사 목록 조회 오류:', error);
      message.error('기사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 통계 조회
  const fetchStats = useCallback(async () => {
    try {
      const response = await labelingAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  }, []);

  // 기사 토큰 조회
  const fetchArticleTokens = useCallback(async (articleId: number) => {
    setLabelingLoading(true);
    try {
      const response = await labelingAPI.getArticleTokens(articleId);
      setSentences(response.data.sentences || []);
    } catch (error) {
      console.error('기사 토큰 조회 오류:', error);
      message.error('기사 토큰을 불러오는데 실패했습니다.');
    } finally {
      setLabelingLoading(false);
    }
  }, []);

  // 라벨링 데이터 저장
  const saveLabelingData = useCallback(async (sentenceIndex: number, tokens: Token[]) => {
    if (!selectedArticle) return;

    try {
      await labelingAPI.createLabelingDataBatch({
        article_id: selectedArticle.id,
        sentence_index: sentenceIndex,
        user_id: null,
        tokens: tokens.map(token => ({
          token_index: token.token_index,
          token_text: token.token_text,
          label: token.label,
          confidence: token.confidence,
          labeled_by: 'manual'
        }))
      });
      message.success('라벨링 데이터가 저장되었습니다.');
    } catch (error) {
      message.error('라벨링 데이터 저장에 실패했습니다.');
    }
  }, [selectedArticle]);

  // 토큰 라벨 변경
  const handleTokenLabelChange = useCallback((sentenceIndex: number, tokenIndex: number, newLabel: string) => {
    setSentences(prev => prev.map(sentence => {
      if (sentence.sentence_index === sentenceIndex) {
        return {
          ...sentence,
          tokens: sentence.tokens.map(token => 
            token.token_index === tokenIndex 
              ? { ...token, label: newLabel }
              : token
          )
        };
      }
      return sentence;
    }));
  }, []);

  // 문장 라벨링 저장
  const handleSaveSentence = useCallback(async (sentenceIndex: number) => {
    const sentence = sentences.find(s => s.sentence_index === sentenceIndex);
    if (sentence) {
      await saveLabelingData(sentenceIndex, sentence.tokens);
    }
  }, [sentences, saveLabelingData]);

  // 기사 라벨링 시작
  const handleStartLabeling = useCallback(async (article: Article) => {
    setSelectedArticle(article);
    setLabelingModalVisible(true);
    await fetchArticleTokens(article.id);
  }, [fetchArticleTokens]);

  // 라벨링 데이터 삭제
  const handleDeleteLabeling = useCallback(async (articleId: number) => {
    Modal.confirm({
      title: '라벨링 데이터 삭제',
      content: '이 기사의 모든 라벨링 데이터를 삭제하시겠습니까?',
      onOk: async () => {
        try {
          await labelingAPI.deleteLabelingData(articleId);
          message.success('라벨링 데이터가 삭제되었습니다.');
          fetchStats();
        } catch (error) {
          message.error('라벨링 데이터 삭제에 실패했습니다.');
        }
      }
    });
  }, [fetchStats]);

  // CSV 다운로드
  const handleDownloadCSV = useCallback(async () => {
    try {
      const response = await labelingAPI.exportCSV();
      
      // Blob 생성
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // 파일명 설정 (응답 헤더에서 추출하거나 기본값 사용)
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'labeling_data.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('CSV 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('CSV 다운로드 오류:', error);
      message.error('CSV 다운로드에 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    console.log('라벨링 페이지 로드됨');
    fetchArticles();
    fetchStats();
  }, [fetchArticles, fetchStats]);

  const columns = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Article) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.scraped_at).toLocaleDateString()}
          </Text>
        </div>
      )
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      render: (record: Article) => (
        <Space>
          <Button 
            type="primary" 
            icon={<TagOutlined />}
            onClick={() => handleStartLabeling(record)}
          >
            라벨링
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteLabeling(record.id)}
          >
            삭제
          </Button>
        </Space>
      )
    }
  ];

  // 권한 체크
  if (!hasPermission('access_labeling')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="라벨링 페이지 접근 권한이 없습니다."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>투자 정보 라벨링</Title>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>기사 목록을 불러오는 중...</div>
        </div>
      )}
      
      {/* 통계 카드 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 기사 수"
                value={stats.total_articles}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="라벨링 완료"
                value={stats.labeled_articles}
                suffix={`/ ${stats.total_articles}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="총 토큰 수"
                value={stats.total_tokens}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="진행률"
                value={stats.progress_percentage}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
              <Progress 
                percent={stats.progress_percentage} 
                size="small" 
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 라벨 분포 */}
      {stats && stats.label_distribution && (
        <Card title="라벨 분포" style={{ marginBottom: '24px' }}>
          <Space wrap>
            {Object.entries(stats.label_distribution).map(([label, count]) => (
              <Tag key={label} color={LABEL_COLORS[label as keyof typeof LABEL_COLORS]}>
                {label}: {count}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 기사 목록 */}
      <Card 
        title="라벨링할 기사 목록"
        extra={
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadCSV}
              type="primary"
            >
              CSV 다운로드
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchArticles}>
              새로고침
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${total}개 기사`
          }}
        />
      </Card>

      {/* 라벨링 모달 */}
      <Modal
        title={`라벨링: ${selectedArticle?.title}`}
        open={labelingModalVisible}
        onCancel={() => setLabelingModalVisible(false)}
        width="90%"
        style={{ top: 20 }}
        footer={null}
      >
        {labelingLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>토큰을 불러오는 중...</div>
          </div>
        ) : (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {sentences.map((sentence) => (
              <Card 
                key={sentence.sentence_index} 
                size="small" 
                style={{ marginBottom: '16px' }}
                title={`문장 ${sentence.sentence_index + 1}`}
                extra={
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleSaveSentence(sentence.sentence_index)}
                  >
                    저장
                  </Button>
                }
              >
                <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                  {sentence.sentence_text}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {sentence.tokens.map((token) => (
                    <Tag
                      key={`${sentence.sentence_index}-${token.token_index}`}
                      color={LABEL_COLORS[token.label as keyof typeof LABEL_COLORS]}
                      style={{ cursor: 'pointer', marginBottom: '4px' }}
                      onClick={() => setEditingToken({
                        sentenceIndex: sentence.sentence_index,
                        tokenIndex: token.token_index
                      })}
                    >
                      {token.token_text}
                    </Tag>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* 토큰 라벨 편집 모달 */}
      <Modal
        title="토큰 라벨 편집"
        open={!!editingToken}
        onCancel={() => setEditingToken(null)}
        onOk={() => setEditingToken(null)}
        width={400}
      >
        {editingToken && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>토큰: </Text>
              <Text code>
                {sentences
                  .find(s => s.sentence_index === editingToken.sentenceIndex)
                  ?.tokens.find(t => t.token_index === editingToken.tokenIndex)
                  ?.token_text}
              </Text>
            </div>
            <div>
              <Text strong>라벨 선택:</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                value={
                  sentences
                    .find(s => s.sentence_index === editingToken.sentenceIndex)
                    ?.tokens.find(t => t.token_index === editingToken.tokenIndex)
                    ?.label
                }
                onChange={(value) => 
                  handleTokenLabelChange(editingToken.sentenceIndex, editingToken.tokenIndex, value)
                }
              >
                {LABEL_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Labeling;
