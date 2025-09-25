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
  Spin
} from 'antd';
import { 
  ApiOutlined, 
  PlayCircleOutlined, 
  CopyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface MatchingRequest {
  prompt: string;
  top_k: number;
  min_confidence: number;
}

interface MatchingResponse {
  company_name: string;
  sectors: string[];
  matched_investors: any[];
  total_found: number;
  algorithm_version: string;
}

const APIDocs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [matchingRequest, setMatchingRequest] = useState<MatchingRequest>({
    prompt: '',
    top_k: 10,
    min_confidence: 0.0
  });
  const [matchingResponse, setMatchingResponse] = useState<MatchingResponse | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');

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
        body: JSON.stringify(matchingRequest)
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

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ApiOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2}>프롬프트 기반 투자사 매칭 API</Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            자연어 프롬프트를 입력하면 자동으로 회사명과 섹터를 추출하여 적합한 투자사를 우선순위별로 추천받는 API입니다.
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
                    <strong>기능:</strong> 자연어 프롬프트에서 회사명과 섹터를 자동 추출하여 적합한 투자사를 우선순위별로 추천
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
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>자연어 프롬프트 (회사명과 섹터가 포함된 문장)</td>
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
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>최소 매칭 신뢰도 (0.0-1.0, 기본값: 0.0)</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📤 응답 형식" size="small">
                  <Collapse>
                    <Panel header="응답 구조 보기" key="1">
                      <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
{`{
  "company_name": "AI",
  "sectors": ["IT", "금융"],
  "matched_investors": [
    {
      "investor_id": 123,
      "investor_name": "테크벤처캐피탈",
      "match_score": 0.85,
      "match_reasons": ["섹터 매칭 (0.80)", "활발한 투자 활동 (0.60)"],
      "sectors": ["IT", "AI", "핀테크"],
      "type": "vc",
      "description": "테크 분야 전문 벤처캐피탈",
      "website": "https://example.com",
      "contact": "contact@example.com",
      "recent_investments": 15,
      "sector_expertise": 0.80
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
                      <Text strong>최소 신뢰도</Text>
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
                      />
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
                <Card title="📊 응답 결과" size="small">
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
                                <div style={{ marginTop: '4px' }}>
                                  {investor.match_reasons.map((reason, i) => (
                                    <Tag key={i} color="orange" style={{ marginRight: '4px' }}>
                                      {reason}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
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
                <Card title="🔍 프롬프트 파싱 과정" size="small">
                  <Alert
                    message="프롬프트에서 회사명과 섹터를 자동으로 추출하는 과정입니다."
                    type="info"
                    style={{ marginBottom: '24px' }}
                  />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card 
                        title="1️⃣ 회사명 추출" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}
                      >
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          정규식 패턴 매칭
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>패턴 1:</strong> "회사", "기업", "스타트업" 앞의 단어</div>
                          <div>• <strong>패턴 2:</strong> "에서", "이", "가", "을", "를" 앞의 단어</div>
                          <div>• <strong>패턴 3:</strong> "의", "에", "로", "으로" 앞의 단어</div>
                          <div>• <strong>기본값:</strong> 프롬프트의 첫 10단어</div>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col span={12}>
                      <Card 
                        title="2️⃣ 섹터 추출" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}
                      >
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          키워드 기반 매칭
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>IT:</strong> it, 소프트웨어, AI, 테크, 기술</div>
                          <div>• <strong>바이오:</strong> 바이오, 의료, 헬스케어, 제약</div>
                          <div>• <strong>제조:</strong> 제조, 자동차, 전자, 반도체</div>
                          <div>• <strong>기본값:</strong> IT (매칭 없을 시)</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🎯 매칭 점수 계산 방식" size="small">
                  <Alert
                    message="매칭 알고리즘은 3가지 요소를 가중치로 조합하여 최종 점수를 계산합니다."
                    type="info"
                    style={{ marginBottom: '24px' }}
                  />
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card 
                        title="1️⃣ 섹터 매칭 (60%)" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}
                      >
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                          60%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                          가장 중요한 요소
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>정확한 매칭:</strong> 1.0점</div>
                          <div>• <strong>부분 매칭:</strong> 0.5점</div>
                          <div>• <strong>정규화:</strong> 매칭 수 / 회사 섹터 수</div>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col span={8}>
                      <Card 
                        title="2️⃣ 투자 활동 (20%)" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}
                      >
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>
                          20%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                          활발한 투자사 우선
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>기간:</strong> 최근 1년간</div>
                          <div>• <strong>정규화:</strong> 투자 건수 / 10</div>
                          <div>• <strong>최대:</strong> 10건 이상 = 1.0점</div>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col span={8}>
                      <Card 
                        title="3️⃣ 회사명 관련성 (20%)" 
                        size="small"
                        style={{ textAlign: 'center', backgroundColor: '#f0f5ff' }}
                      >
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                          20%
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                          이름 유사도 분석
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px' }}>
                          <div>• <strong>정확한 매칭:</strong> 1.0점</div>
                          <div>• <strong>부분 매칭:</strong> 0.7점</div>
                          <div>• <strong>단어 매칭:</strong> 공통 단어 비율 × 0.5</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="📊 최종 점수 계산 공식" size="small">
                  <div style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '20px', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                      최종 점수 = (섹터 매칭 × 0.6) + (투자 활동 × 0.2) + (회사명 관련성 × 0.2)
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      각 요소는 0.0 ~ 1.0 사이의 값으로 정규화됩니다
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🔍 실제 계산 예시" size="small">
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>회사: "테크스타트업", 섹터: ["IT", "AI"]</Text>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>투자사</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>섹터 매칭</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>투자 활동</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>회사명 관련성</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>최종 점수</th>
                        <th style={{ padding: '8px', border: '1px solid #d9d9d9' }}>순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>퓨처플레이</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>1.0 (IT,AI 정확 매칭)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.0 (최근 투자 0건)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.0 (관련성 없음)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>0.6</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>1위</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>끌림벤처스</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>1.0 (IT,AI 정확 매칭)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.0 (최근 투자 0건)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.0 (관련성 없음)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>0.6</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>2위</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>테크벤처캐피탈</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.5 (IT만 매칭)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.8 (최근 투자 8건)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>0.5 (테크 공통)</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9', fontWeight: 'bold' }}>0.56</td>
                        <td style={{ padding: '8px', border: '1px solid #d9d9d9' }}>3위</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="⚙️ 매칭 이유 생성" size="small">
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>각 투자사에 대해 자동으로 매칭 이유를 생성합니다:</Text>
                  </div>
                  
                  <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
                    <pre style={{ margin: 0, fontSize: '12px' }}>
{`// 매칭 이유 생성 로직
match_reasons = []
if sector_score > 0.5:
    match_reasons.append(f"섹터 매칭 ({sector_score:.2f})")
if activity_score > 0.3:
    match_reasons.append(f"활발한 투자 활동 ({activity_score:.2f})")
if name_relevance_score > 0.3:
    match_reasons.append(f"회사명 관련성 ({name_relevance_score:.2f})")`}
                    </pre>
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>예시 결과:</Text>
                    <ul style={{ marginTop: '8px' }}>
                      <li><Tag color="green">섹터 매칭 (1.00)</Tag></li>
                      <li><Tag color="orange">활발한 투자 활동 (0.80)</Tag></li>
                      <li><Tag color="blue">회사명 관련성 (0.50)</Tag></li>
                    </ul>
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="🎛️ 설정 가능한 파라미터" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>
                        <Text strong>top_k</Text>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          반환할 투자사 수 (1-100, 기본값: 10)
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div>
                        <Text strong>min_confidence</Text>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          최소 신뢰도 (0.0-1.0, 기본값: 0.0)
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <Alert
                    message="💡 팁"
                    description="min_confidence를 0.3 이상으로 설정하면 더 정확한 매칭 결과만 반환됩니다."
                    type="info"
                    showIcon
                  />
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
    "min_confidence": 0.3
}

# API 호출
response = requests.post(url, json=data)

if response.status_code == 200:
    result = response.json()
    print(f"총 {result['total_found']}개의 투자사 중 상위 {len(result['matched_investors'])}개:")
    
    for i, investor in enumerate(result['matched_investors'], 1):
        print(f"{i}. {investor['investor_name']} (점수: {investor['match_score']})")
        print(f"   섹터: {', '.join(investor['sectors'])}")
        print(f"   매칭 이유: {', '.join(investor['match_reasons'])}")
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
    min_confidence: 0.3
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
        console.log(\`   매칭 이유: \${investor.match_reasons.join(', ')}\`);
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
    private Double minConfidence = 0.0;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResponse {
    private String companyName;
    private List<String> sectors;
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
    private List<String> matchReasons;
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
        MatchingResponse response = matchingService.findMatchingInvestors(
            "AI 스타트업에서 투자를 받고 싶어요",
            5,
            0.3
        );
        
        // 결과 처리
        System.out.println("총 " + response.getTotalFound() + "개의 투자사 중 상위 " + 
                          response.getMatchedInvestors().size() + "개:");
        
        response.getMatchedInvestors().forEach((investor, index) -> {
            System.out.println((index + 1) + ". " + investor.getInvestorName() + 
                             " (점수: " + investor.getMatchScore() + ")");
            System.out.println("   섹터: " + String.join(", ", investor.getSectors()));
            System.out.println("   매칭 이유: " + String.join(", ", investor.getMatchReasons()));
        });
        
        return ResponseEntity.ok(response);
    }
}`;
};

export default APIDocs;
