import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  Button, 
  Input, 
  Space, 
  message, 
  Divider,
  Row,
  Col,
  Tag,
  Collapse,
  Alert,
  Spin,
  Result
} from 'antd';
import { 
  ApiOutlined, 
  PlayCircleOutlined, 
  CopyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { usePermissions } from '../utils/permissions';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface MatchingRequest {
  prompt: string;
  top_k: number;
  min_confidence?: number;
}

interface MatchingResponse {
  query: string;
  matched_investors: any[];
  total_found: number;
  algorithm_version: string;
}

const APIDocs: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [matchingRequest, setMatchingRequest] = useState<MatchingRequest>({
    prompt: '',
    top_k: 10,
    min_confidence: 0.0
  });
  const [matchingResponse, setMatchingResponse] = useState<MatchingResponse | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'summary' | 'json'>('summary');

  // 매칭 API 테스트
  const handleMatchingTest = async () => {
    if (!matchingRequest.prompt.trim()) {
      message.error('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/matching/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: matchingRequest.prompt,
          top_k: matchingRequest.top_k,
          ...(matchingRequest.min_confidence !== undefined && { min_confidence: matchingRequest.min_confidence })
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatchingResponse(data);
      message.success('매칭 결과를 성공적으로 조회했습니다.');
    } catch (error: any) {
      console.error('매칭 API 오류:', error);
      message.error(`매칭 API 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // JSON 복사
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      message.success(`${label}이 클립보드에 복사되었습니다.`);
      setTimeout(() => setCopiedText(''), 2000);
    });
  };

  // 예제 요청 JSON 생성
  const generateExampleRequest = () => {
    return JSON.stringify({
      prompt: "AI 스타트업에서 투자를 받고 싶어요",
      top_k: 5,
      min_confidence: 0.3
    }, null, 2);
  };

  // cURL 예제 생성
  const generateCurlExample = () => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
    return `curl -X POST "${baseUrl}/api/matching/match" \\
  -H "Content-Type: application/json" \\
  -d '${generateExampleRequest()}'`;
  };

  // 권한 체크
  if (!hasPermission('access_api_docs')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="API 문서 페이지 접근 권한이 없습니다."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ApiOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2}>Vector Search + RAG Logic 기반 투자사 매칭 API</Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            자연어 프롬프트를 벡터로 변환하여 유사한 투자사를 검색하고, LLM을 사용하여 추천 사유를 생성하는 API입니다.
          </Paragraph>
        </div>

        <Tabs defaultActiveKey="1">
          {/* API 사용법 */}
          <TabPane tab="API 사용법" key="1">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card title="📋 API 개요" size="small">
                  <Paragraph>
                    <strong>엔드포인트:</strong> <code>POST /api/matching/match</code>
                  </Paragraph>
                  <Paragraph>
                    <strong>기능:</strong> Vector Search와 RAG Logic을 사용하여 사용자 요청에 맞는 투자사를 추천하고 추천 사유를 생성
                  </Paragraph>
                  <Paragraph>
                    <strong>알고리즘:</strong> Query Embedder → Vector Search → RAG Logic
                  </Paragraph>
                  <Paragraph>
                    <strong>응답 형식:</strong> JSON
                  </Paragraph>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📝 요청 파라미터" size="small">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>필드</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>타입</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>필수</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>prompt</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>string</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>✅</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>자연어 프롬프트 (투자 요청 내용)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>top_k</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>number</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>❌</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>반환할 투자사 수 (기본값: 10, 최대: 100)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>min_confidence</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>number</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>❌</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>최소 매칭 점수 (기본값: 0.0, 범위: 0.0 ~ 1.0)</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📨 API 요청 형식" size="small">
                  <Paragraph style={{ marginBottom: '16px' }}>
                    <Text strong>엔드포인트:</Text> <code>POST /api/matching/match</code>
                  </Paragraph>
                  <Paragraph style={{ marginBottom: '16px' }}>
                    <Text strong>Content-Type:</Text> <code>application/json</code>
                  </Paragraph>
                  
                  <Divider>요청 본문 (Request Body)</Divider>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>기본 요청 형식:</Text>
                    <div style={{ position: 'relative', marginTop: '8px' }}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(generateExampleRequest(), '요청 JSON')}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                      >
                        {copiedText === '요청 JSON' ? <CheckCircleOutlined /> : <CopyOutlined />}
                      </Button>
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '16px', 
                        borderRadius: '4px', 
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.5',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
{`{
  "prompt": "AI 스타트업에서 투자를 받고 싶어요",
  "top_k": 5,
  "min_confidence": 0.3
}`}
                      </pre>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>최소 요청 형식 (필수 파라미터만):</Text>
                    <div style={{ position: 'relative', marginTop: '8px' }}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(JSON.stringify({
                          prompt: "AI 스타트업에서 투자를 받고 싶어요"
                        }, null, 2), '최소 요청 JSON')}
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                      >
                        {copiedText === '최소 요청 JSON' ? <CheckCircleOutlined /> : <CopyOutlined />}
                      </Button>
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '16px', 
                        borderRadius: '4px', 
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: '1.5',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
{`{
  "prompt": "AI 스타트업에서 투자를 받고 싶어요"
}`}
                      </pre>
                    </div>
                  </div>

                  <Alert
                    message="요청 예시"
                    description={
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong>예시 1:</Text> 기본 요청
                        </div>
                        <code style={{ display: 'block', marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          {`{ "prompt": "바이오테크 스타트업에 투자받고 싶습니다", "top_k": 10 }`}
                        </code>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong>예시 2:</Text> 지역명 포함
                        </div>
                        <code style={{ display: 'block', marginBottom: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          {`{ "prompt": "서울 지역 AI 스타트업에서 시리즈A 투자를 받고 싶어요", "top_k": 5 }`}
                        </code>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <Text strong>예시 3:</Text> 최소 신뢰도 설정
                        </div>
                        <code style={{ display: 'block', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                          {`{ "prompt": "핀테크 스타트업 투자", "top_k": 20, "min_confidence": 0.5 }`}
                        </code>
                      </div>
                    }
                    type="info"
                    style={{ marginTop: '16px' }}
                  />
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📤 응답 형식" size="small">
                  <Collapse>
                    <Panel header="응답 구조 보기" key="1">
                      <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
{`{
  "query": "AI 스타트업에서 시리즈A 투자를 받고 싶어요",
  "matched_investors": [
    {
      "investor_id": 123,
      "investor_name": "테크벤처캐피탈",
      "match_score": 0.892,
      "recommendation_reason": "AI 분야 전문 투자사로, 최근 AI 스타트업 3건 투자 실적이 있으며 시리즈A 단계 투자 경험이 풍부합니다.",
      "sectors": ["IT", "AI", "핀테크"],
      "type": "vc",
      "description": "테크 분야 전문 벤처캐피탈",
      "website": "https://example.com",
      "contact": "contact@example.com",
      "profile_text": "테크벤처캐피탈은 AI와 딥테크 분야의 초기 스타트업을 투자하는 벤처캐피털입니다...",
      "recent_investments": [],
      "funds": []
    }
  ],
  "total_found": 25,
  "algorithm_version": "2.0"
}`}
                      </pre>
                    </Panel>
                  </Collapse>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* API 테스트 */}
          <TabPane tab="API 테스트" key="2">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title="🔧 요청 설정" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>프롬프트 입력</Text>
                      <Input.TextArea
                        placeholder="예: AI 스타트업에서 투자를 받고 싶어요"
                        value={matchingRequest.prompt}
                        onChange={(e) => setMatchingRequest({
                          ...matchingRequest,
                          prompt: e.target.value
                        })}
                        rows={3}
                      />
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        자연어로 회사명과 섹터가 포함된 문장을 입력하세요. 시스템이 자동으로 추출합니다.
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        예시: "소프트웨어 개발 회사에서 투자를 받고 싶어요", "바이오테크 스타트업에 투자받고 싶습니다"
                      </div>
                    </div>

                    <div>
                      <Text strong>반환할 투자사 수</Text>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={matchingRequest.top_k}
                        onChange={(e) => setMatchingRequest({
                          ...matchingRequest,
                          top_k: parseInt(e.target.value) || 10
                        })}
                      />
                    </div>

                    <div>
                      <Text strong>최소 매칭 점수 (선택)</Text>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={matchingRequest.min_confidence}
                        onChange={(e) => setMatchingRequest({
                          ...matchingRequest,
                          min_confidence: parseFloat(e.target.value) || 0.0
                        })}
                        placeholder="0.0"
                      />
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        이 점수 이상인 투자사만 반환됩니다 (0.0 ~ 1.0)
                      </div>
                    </div>

                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleMatchingTest}
                      loading={loading}
                      style={{ width: '100%' }}
                    >
                      API 테스트 실행
                    </Button>
                  </Space>
                </Card>
              </Col>

              <Col span={12}>
                <Card 
                  title="📊 응답 결과" 
                  size="small"
                  extra={
                    matchingResponse && (
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(JSON.stringify(matchingResponse, null, 2), '응답 JSON')}
                      >
                        {copiedText === '응답 JSON' ? <CheckCircleOutlined /> : 'JSON 복사'}
                      </Button>
                    )
                  }
                >
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>매칭 결과를 조회하는 중...</div>
                    </div>
                  ) : matchingResponse ? (
                    <div>
                      <Alert
                        message={`${matchingResponse.total_found}개의 투자사 중 상위 ${matchingResponse.matched_investors.length}개를 반환했습니다.`}
                        type="success"
                        style={{ marginBottom: '16px' }}
                      />
                      
                      <div style={{ marginBottom: '12px' }}>
                        <Space>
                          <Button
                            size="small"
                            type={viewMode === 'summary' ? 'primary' : 'default'}
                            onClick={() => setViewMode('summary')}
                          >
                            요약 보기
                          </Button>
                          <Button
                            size="small"
                            type={viewMode === 'json' ? 'primary' : 'default'}
                            onClick={() => setViewMode('json')}
                          >
                            JSON 보기
                          </Button>
                        </Space>
                      </div>
                      
                      {viewMode === 'summary' ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          {matchingResponse.matched_investors.map((investor, index) => (
                            <Card key={investor.investor_id} size="small" style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <Text strong>#{index + 1} {investor.investor_name}</Text>
                                  <div style={{ marginTop: '4px' }}>
                                    <Tag color="blue">점수: {investor.match_score}</Tag>
                                    <Tag color="green">{investor.type}</Tag>
                                  </div>
                                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                                    {investor.recommendation_reason}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(JSON.stringify(matchingResponse, null, 2), '응답 JSON')}
                            style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                          >
                            {copiedText === '응답 JSON' ? <CheckCircleOutlined /> : <CopyOutlined />}
                          </Button>
                          <pre style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '16px', 
                            borderRadius: '4px', 
                            margin: 0,
                            maxHeight: '500px',
                            overflow: 'auto',
                            fontSize: '12px',
                            lineHeight: '1.5',
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {JSON.stringify(matchingResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <InfoCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div>왼쪽에서 요청을 설정하고 테스트를 실행해주세요.</div>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 매칭 알고리즘 */}
          <TabPane tab="매칭 알고리즘" key="3">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card title="🔄 처리 흐름" size="small">
                  <Alert
                    message="graphtd.txt 구조에 따른 Vector Search + RAG Logic 기반 매칭 프로세스"
                    type="info"
                    style={{ marginBottom: '24px' }}
                  />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card 
                        title="1️⃣ Query Embedder" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}
                      >
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          사용자 입력을 벡터로 변환
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>모델:</strong> OpenAI text-embedding-3-small</div>
                          <div>• <strong>입력:</strong> 자연어 프롬프트</div>
                          <div>• <strong>출력:</strong> 1536차원 벡터</div>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col span={8}>
                      <Card 
                        title="2️⃣ Vector Search" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}
                      >
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          ChromaDB에서 유사한 투자사 검색
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>DB:</strong> ChromaDB (Persistent)</div>
                          <div>• <strong>방법:</strong> Cosine Similarity</div>
                          <div>• <strong>결과:</strong> Top K 투자사 + 유사도 점수</div>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col span={8}>
                      <Card 
                        title="3️⃣ RAG Logic" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#f0f5ff' }}
                      >
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          LLM으로 추천 사유 생성
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>모델:</strong> GPT-4o-mini</div>
                          <div>• <strong>입력:</strong> 사용자 쿼리 + 투자사 프로필</div>
                          <div>• <strong>출력:</strong> 추천 사유 (2-3문장)</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📊 유사도 점수 계산" size="small">
                  <Alert
                    message="Vector Search는 Cosine Distance를 사용하여 유사도를 계산합니다."
                    type="info"
                    style={{ marginBottom: '24px' }}
                  />
                  
                  <div style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '20px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                      유사도 점수 = 1 - Cosine Distance
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      점수가 높을수록 사용자 요청과 유사한 투자사입니다 (0.0 ~ 1.0)
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>점수 해석:</Text>
                    <ul style={{ marginTop: '8px' }}>
                      <li><Tag color="green">0.8 이상</Tag>: 매우 유사한 투자사</li>
                      <li><Tag color="blue">0.6 ~ 0.8</Tag>: 유사한 투자사</li>
                      <li><Tag color="orange">0.4 ~ 0.6</Tag>: 보통 유사도</li>
                      <li><Tag color="red">0.4 미만</Tag>: 낮은 유사도</li>
                    </ul>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🤖 RAG Logic (추천 사유 생성)" size="small">
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>각 투자사마다 LLM을 사용하여 추천 사유를 생성합니다:</Text>
                  </div>
                  
                  <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>입력 정보:</div>
                    <ul style={{ margin: 0, fontSize: '12px' }}>
                      <li>사용자 쿼리 (프롬프트)</li>
                      <li>투자사 프로필 텍스트 (profile_text)</li>
                      <li>투자 분야 (sectors)</li>
                      <li>투자 단계 (stage)</li>
                      <li>투자사 설명 (description)</li>
                    </ul>
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>예시 추천 사유:</Text>
                    <div style={{ 
                      backgroundColor: '#f0f5ff', 
                      padding: '12px', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      fontSize: '13px'
                    }}>
                      "AI 분야 전문 투자사로, 최근 AI 스타트업 3건 투자 실적이 있으며 시리즈A 단계 투자 경험이 풍부합니다."
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🎛️ 설정 가능한 파라미터" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div>
                        <Text strong>top_k</Text>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          반환할 투자사 수 (1-100, 기본값: 10)
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 코드 예제 */}
          <TabPane tab="코드 예제" key="4">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card title="🐍 Python 예제" size="small">
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generatePythonExample(), 'Python 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'Python 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', margin: 0 }}>
{generatePythonExample()}
                    </pre>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🌐 cURL 예제" size="small">
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateCurlExample(), 'cURL 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'cURL 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', margin: 0 }}>
{generateCurlExample()}
                    </pre>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📝 JavaScript 예제" size="small">
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateJavaScriptExample(), 'JavaScript 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'JavaScript 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', margin: 0 }}>
{generateJavaScriptExample()}
                    </pre>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="☕ Spring Boot 예제" size="small">
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateSpringBootExample(), 'Spring Boot 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'Spring Boot 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', margin: 0 }}>
{generateSpringBootExample()}
                    </pre>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Python 예제 생성
const generatePythonExample = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
  return `import requests
import json

# API 엔드포인트
url = "${baseUrl}/api/matching/match"

# 요청 데이터
data = {
    "prompt": "AI 스타트업에서 투자를 받고 싶어요",
    "top_k": 5,
    "min_confidence": 0.3  # 선택사항
}

# API 호출
response = requests.post(url, json=data)

if response.status_code == 200:
    result = response.json()
    print(f"총 {result['total_found']}개의 투자사 중 상위 {len(result['matched_investors'])}개:")
    
    for i, investor in enumerate(result['matched_investors'], 1):
        print(f"{i}. {investor['investor_name']} (점수: {investor['match_score']})")
        print(f"   섹터: {', '.join(investor['sectors'])}")
        print(f"   추천 사유: {investor['recommendation_reason']}")
        print()
else:
    print(f"오류 발생: {response.status_code}")
    print(response.text)`;
};

// JavaScript 예제 생성
const generateJavaScriptExample = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
  return `// Fetch API 사용
const apiUrl = "${baseUrl}/api/matching/match";

const requestData = {
    prompt: "AI 스타트업에서 투자를 받고 싶어요",
    top_k: 5,
    min_confidence: 0.3  // 선택사항
};

fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
})
.then(response => response.json())
.then(data => {
    console.log(\`총 \${data.total_found}개의 투자사 중 상위 \${data.matched_investors.length}개:\`);
    
    data.matched_investors.forEach((investor, index) => {
        console.log(\`\${index + 1}. \${investor.investor_name} (점수: \${investor.match_score})\`);
        console.log(\`   섹터: \${investor.sectors.join(', ')}\`);
        console.log(\`   추천 사유: \${investor.recommendation_reason}\`);
        console.log();
    });
})
.catch(error => {
    console.error('오류 발생:', error);
});

// Axios 사용
import axios from 'axios';

axios.post(apiUrl, requestData)
    .then(response => {
        const data = response.data;
        console.log(\`총 \${data.total_found}개의 투자사 중 상위 \${data.matched_investors.length}개:\`);
        // ... 처리 로직
    })
    .catch(error => {
        console.error('오류 발생:', error);
    });`;
};

// Spring Boot 예제 생성
const generateSpringBootExample = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
  return `// 1. DTO 클래스 정의
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRequest {
    private String prompt;
    private Integer topK = 10;
    private Double minConfidence = 0.0;  // 선택사항
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResponse {
    private String query;
    private List<InvestorMatch> matchedInvestors;
    private Integer totalFound;
    private String algorithmVersion;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestorMatch {
    private Integer investorId;
    private String investorName;
    private Double matchScore;
    private String recommendationReason;
    private List<String> sectors;
    private String type;
    private String description;
    private String website;
    private String contact;
    private Integer recentInvestments;
    private Double sectorExpertise;
}

// 2. Service 클래스
@Service
public class InvestorMatchingService {
    
    @Value("\${api.matching.url:${baseUrl}/api/matching}")
    private String apiUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    public MatchingResponse findMatchingInvestors(String prompt, Integer topK, Double minConfidence) {
        MatchingRequest request = new MatchingRequest(prompt, topK, minConfidence);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<MatchingRequest> entity = new HttpEntity<>(request, headers);
        
        try {
            ResponseEntity<MatchingResponse> response = restTemplate.postForEntity(
                apiUrl + "/match", 
                entity, 
                MatchingResponse.class
            );
            
            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("투자사 매칭 API 호출 실패: " + e.getMessage(), e);
        }
    }
}

// 3. Controller 클래스
@RestController
@RequestMapping("/api/investor-matching")
public class InvestorMatchingController {
    
    @Autowired
    private InvestorMatchingService matchingService;
    
    @PostMapping("/match")
    public ResponseEntity<MatchingResponse> matchInvestors(@RequestBody MatchingRequest request) {
        try {
            MatchingResponse response = matchingService.findMatchingInvestors(
                request.getPrompt(),
                request.getTopK(),
                request.getMinConfidence()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
}

// 4. Configuration 클래스
@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

// 5. application.yml 설정
api:
  matching:
    url: ${baseUrl}/api/matching

// 6. 사용 예시
@RestController
public class ExampleController {
    
    @Autowired
    private InvestorMatchingService matchingService;
    
    @GetMapping("/example")
    public ResponseEntity<?> example() {
        // 투자사 매칭 요청
        MatchingRequest request = new MatchingRequest(
            "AI 스타트업에서 투자를 받고 싶어요",
            5,
            0.3
        );
        MatchingResponse response = matchingService.findMatchingInvestors(
            request.getPrompt(),
            request.getTopK(),
            request.getMinConfidence()
        );
        
        // 결과 처리
        System.out.println("총 " + response.getTotalFound() + "개의 투자사 중 상위 " + 
                          response.getMatchedInvestors().size() + "개:");
        
        response.getMatchedInvestors().forEach((investor, index) -> {
            System.out.println((index + 1) + ". " + investor.getInvestorName() + 
                             " (점수: " + investor.getMatchScore() + ")");
            System.out.println("   섹터: " + String.join(", ", investor.getSectors()));
            System.out.println("   추천 사유: " + investor.getRecommendationReason());
        });
        
        return ResponseEntity.ok(response);
    }
}`;
};

export default APIDocs;
