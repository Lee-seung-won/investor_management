import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, message, Space, Row, Col, Card, Typography, Spin, Radio, DatePicker } from 'antd';
import { Article } from '../types/index';
import { investmentsAPI, articlesAPI, fundsAPI } from '../services/api.ts';

const { Option } = Select;
const { Text } = Typography;

interface InvestmentInputModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (investmentData: any) => void;
  article: Article | null;
  investorName?: string;
}

const InvestmentInputModal: React.FC<InvestmentInputModalProps> = ({
  visible,
  onCancel,
  onSave,
  article,
  investorName
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scrapingContent, setScrapingContent] = useState(false);
  const [articleContent, setArticleContent] = useState(article?.content || '');
  const [investmentType, setInvestmentType] = useState<'investment' | 'fund' | 'none'>('investment');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualContent, setManualContent] = useState('');

  // 투자 유형이 변경될 때 폼 초기화 및 추출된 정보 적용
  const handleInvestmentTypeChange = (value: 'investment' | 'fund' | 'none') => {
    setInvestmentType(value);
    form.resetFields();
    
    // 추출된 정보가 있으면 새 유형에 맞게 적용
    if (extractedInfo.round || extractedInfo.sector || extractedInfo.amount) {
      applyExtractedInfoToForm(extractedInfo);
    }
  };

  // article이 변경될 때 articleContent 업데이트
  useEffect(() => {
    if (article?.content) {
      setArticleContent(article.content);
    }
  }, [article]);

  // 기사 본문 크롤링 함수
  const handleScrapeContent = async () => {
    if (!article?.id) return;
    
    setScrapingContent(true);
    try {
      const response = await articlesAPI.scrapeArticleContent(article.id);
      if (response.data.success) {
        setArticleContent(response.data.content || article.content);
        message.success('기사 본문이 성공적으로 업데이트되었습니다.');
        setShowManualInput(false);
      } else {
        // 크롤링 실패해도 응답에 content가 있으면 사용
        if (response.data.content) {
          setArticleContent(response.data.content);
          message.warning('크롤링에 실패했지만 기존 내용을 표시합니다.');
          setShowManualInput(false);
        } else {
          message.warning(response.data.message || '크롤링에 실패했습니다. 수동 입력을 사용하세요.');
          setShowManualInput(true);
        }
      }
    } catch (error) {
      console.error('Content scraping error:', error);
      message.error('기사 본문 크롤링 중 오류가 발생했습니다. 수동 입력을 사용하세요.');
      setShowManualInput(true);
    } finally {
      setScrapingContent(false);
    }
  };

  // 수동 본문 입력 함수
  const handleManualContentSubmit = async () => {
    if (manualContent.trim()) {
      try {
        // 데이터베이스에 본문 저장
        if (article?.id) {
          await articlesAPI.updateArticleContent(article.id, manualContent);
        }
        
        setArticleContent(manualContent);
        setShowManualInput(false);
        message.success('수동으로 입력한 본문이 적용되고 데이터베이스에 저장되었습니다.');
      } catch (error) {
        console.error('본문 저장 중 오류:', error);
        message.error('본문 저장에 실패했습니다.');
      }
    } else {
      message.warning('본문을 입력해주세요.');
    }
  };

  // 수동 입력 취소 함수
  const handleManualInputCancel = () => {
    setShowManualInput(false);
    setManualContent('');
  };

  // 기사 본문을 문장 단위로 분할하는 함수
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    
    // 문장 끝 패턴으로 분할 (., !, ?, ;, 줄바꿈)
    const sentences = text
      .split(/[.!?;]\s*|\n+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 5); // 너무 짧은 문장 제거
    
    return sentences;
  };

  // 추출된 투자 정보를 하이라이트하는 함수
  const highlightExtractedInfo = (sentence: string) => {
    let highlightedText = sentence;
    
    // 추출된 투자사 정보 하이라이트
    if (extractedInfo.investor) {
      const regex = new RegExp(`(${extractedInfo.investor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
    }
    
    // 추출된 라운드 정보 하이라이트
    if (extractedInfo.round) {
      const regex = new RegExp(`(${extractedInfo.round.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark style="background-color: #d4edda; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
    }
    
    // 추출된 섹터 정보 하이라이트
    if (extractedInfo.sector) {
      const regex = new RegExp(`(${extractedInfo.sector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark style="background-color: #d1ecf1; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
    }
    
    // 추출된 금액 정보 하이라이트
    if (extractedInfo.amount) {
      const regex = new RegExp(`(${extractedInfo.amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark style="background-color: #f8d7da; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
    }
    
    return highlightedText;
  };

  // 기사 본문에서 투자 정보를 자동 추출하는 함수
  const extractInvestmentInfo = useCallback((content: string) => {
    if (!content) return { round: '', sector: '', amount: '', investor: '' };

    // 라운드 추출 (시드, 시리즈A, 시리즈B, 시리즈C, 프리A, 프리B 등)
    const roundPatterns = [
      /(시드\s*라운드?|시드\s*투자)/gi,
      /(프리\s*[ABC]|프리\s*시리즈\s*[ABC])/gi,
      /(시리즈\s*[ABC]|시리즈\s*[ABC]\s*라운드?)/gi,
      /(라운드\s*[ABC]|라운드\s*투자)/gi,
      /(투자\s*유치|투자\s*라운드)/gi
    ];

    let extractedRound = '';
    for (const pattern of roundPatterns) {
      const match = content.match(pattern);
      if (match) {
        extractedRound = match[0];
        break;
      }
    }

    // 섹터 추출 (IT, 바이오, 핀테크, 에너지, 헬스케어 등)
    const sectorPatterns = [
      /(IT|아이티|정보기술)/gi,
      /(바이오|바이오테크|생명공학)/gi,
      /(핀테크|금융기술|금융IT)/gi,
      /(에너지|신재생에너지|태양광|풍력)/gi,
      /(헬스케어|의료|헬스|의료기기)/gi,
      /(모빌리티|자율주행|전기차|EV)/gi,
      /(AI|인공지능|머신러닝|딥러닝)/gi,
      /(블록체인|암호화폐|비트코인)/gi,
      /(게임|게임개발|게임플랫폼)/gi,
      /(이커머스|온라인쇼핑|전자상거래)/gi,
      /(교육|에듀테크|온라인교육)/gi,
      /(부동산|프롭테크|부동산기술)/gi,
      /(로봇|로봇공학|자동화)/gi,
      /(소셜|소셜네트워크|SNS)/gi,
      /(콘텐츠|미디어|엔터테인먼트)/gi
    ];

    let extractedSector = '';
    for (const pattern of sectorPatterns) {
      const match = content.match(pattern);
      if (match) {
        extractedSector = match[0];
        break;
      }
    }

    // 투자 금액 추출 (억원, 만원, 달러 등)
    const amountPatterns = [
      /(\d+(?:\.\d+)?)\s*억\s*원/gi,
      /(\d+(?:\.\d+)?)\s*만\s*원/gi,
      /(\d+(?:\.\d+)?)\s*달러/gi,
      /(\d+(?:\.\d+)?)\s*USD/gi,
      /(\d+(?:\.\d+)?)\s*억\s*달러/gi,
      /(\d+(?:\.\d+)?)\s*조\s*원/gi
    ];

    let extractedAmount = '';
    for (const pattern of amountPatterns) {
      const match = content.match(pattern);
      if (match) {
        extractedAmount = match[0];
        break;
      }
    }

    // 투자사 이름 추출 (기사 제목에서)
    let extractedInvestor = '';
    if (article?.title) {
      // 투자사 이름 패턴 (VC, 액셀러레이터, 기업명 등)
      const investorPatterns = [
        /([가-힣]+(?:벤처|캐피탈|파트너스|인베스트|투자|VC|액셀러레이터))/gi,
        /([가-힣]+(?:그룹|기업|회사|코퍼레이션))/gi,
        /([가-힣]+(?:펀드|펀드매니저|자산운용))/gi,
        /([가-힣]+(?:인베스트먼트|인베스트먼츠))/gi,
        /([가-힣]+(?:홀딩스|홀딩))/gi,
        /([가-힣]+(?:네트워크|네트워크스))/gi,
        /([가-힣]+(?:스튜디오|스튜디오스))/gi,
        /([가-힣]+(?:랩|랩스|랩스))/gi,
        /([가-힣]+(?:스페이스|스페이스스))/gi,
        /([가-힣]+(?:크리에이티브|크리에이티브스))/gi
      ];

      for (const pattern of investorPatterns) {
        const match = article.title.match(pattern);
        if (match) {
          extractedInvestor = match[0];
          break;
        }
      }
    }

    return {
      round: extractedRound,
      sector: extractedSector,
      amount: extractedAmount,
      investor: extractedInvestor
    };
  }, [article]);

  // 추출된 정보를 폼에 자동 입력하는 함수
  const applyExtractedInfoToForm = useCallback((extracted: { round: string; sector: string; amount: string; investor: string }) => {
    if (investmentType === 'investment') {
      if (extracted.round) {
        form.setFieldsValue({ round_type: extracted.round });
      }
      if (extracted.sector) {
        form.setFieldsValue({ sector: extracted.sector });
      }
      if (extracted.amount) {
        form.setFieldsValue({ amount: extracted.amount });
      }
      if (extracted.investor) {
        form.setFieldsValue({ investor_name: extracted.investor });
      }
    } else if (investmentType === 'fund') {
      if (extracted.sector) {
        form.setFieldsValue({ fund_sector: extracted.sector });
      }
      if (extracted.amount) {
        form.setFieldsValue({ fund_amount: extracted.amount });
      }
    }
  }, [investmentType, form]);

  // 추출된 투자 정보 상태
  const [extractedInfo, setExtractedInfo] = useState({ round: '', sector: '', amount: '' });

  // 모달이 열릴 때 투자사 이름 설정
  useEffect(() => {
    if (visible && investorName) {
      form.setFieldsValue({ investor_name: investorName });
    }
  }, [visible, investorName, form]);

  // 기사 본문이 변경될 때 투자 정보 자동 추출
  useEffect(() => {
    if (articleContent) {
      const extracted = extractInvestmentInfo(articleContent);
      setExtractedInfo(extracted);
      applyExtractedInfoToForm(extracted);
    }
  }, [articleContent, form, investmentType, extractInvestmentInfo, applyExtractedInfoToForm]);

  const handleSave = async () => {
    setLoading(true);

    try {
      if (investmentType === 'investment') {
        // 필수 필드 검증
        const values = await form.validateFields();
        
        if (!values.startup_name || !values.investor_name || !values.sector) {
          message.error('스타트업명, 투자사명, 섹터는 필수 입력 항목입니다.');
          return;
        }
        
        const investmentData = {
          article_id: article?.id,
          startup_name: values.startup_name,
          investor_name: values.investor_name,
          round_type: values.round_type || null,
          amount: values.amount || null,
          currency: values.currency || 'KRW',
          sector: values.sector,
          investment_date: values.investment_date ? 
            (typeof values.investment_date === 'string' ? values.investment_date : values.investment_date.format('YYYY-MM-DD')) : 
            null,
          extraction_method: 'manual',
          is_verified: true,
          is_correct: true
        };
        
        await investmentsAPI.createInvestment(investmentData);
        form.resetFields();
        message.success('투자 정보가 저장되었습니다.');
        onSave(investmentData);
      } else if (investmentType === 'fund') {
        const values = await form.validateFields();
        const fundData = {
          article_id: article?.id,
          fund_name: values.fund_name,
          fund_amount: values.fund_amount,
          fund_currency: values.fund_currency,
          fund_establishment_date: values.fund_establishment_date ? 
            (typeof values.fund_establishment_date === 'string' ? values.fund_establishment_date : values.fund_establishment_date.format('YYYY-MM-DD')) : 
            null,
          fund_duration: values.fund_duration,
          fund_end_date: values.fund_end_date ? 
            (typeof values.fund_end_date === 'string' ? values.fund_end_date : values.fund_end_date.format('YYYY-MM-DD')) : 
            null,
          fund_sector: values.fund_sector,
          fund_manager: values.fund_manager
        };
        
        await fundsAPI.createFund(fundData);
        form.resetFields();
        message.success('펀드 정보가 저장되었습니다. 기사 처리가 완료되었습니다.');
        onSave(fundData);
      } else if (investmentType === 'none') {
        // 기사만 처리하고 별도 정보 저장하지 않음
        if (article?.id) {
          await articlesAPI.markArticleProcessed(article.id);
        }
        message.success('기사 처리가 완료되었습니다.');
        onSave({});
      }
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', error.response?.data || error.message);
      message.error(`정보 저장에 실패했습니다: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="투자 정보 입력"
      open={visible}
      onCancel={handleCancel}
      width={1400}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          취소
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading} 
          onClick={handleSave}
        >
          {investmentType === 'none' ? '처리 완료' : '저장'}
        </Button>,
      ]}
    >
      <Row gutter={24}>
        {/* 왼쪽: 기사 본문 */}
        <Col span={12}>
          {/* 추출된 투자 정보 표시 */}
          {(extractedInfo.round || extractedInfo.sector || extractedInfo.amount) && (
            <Card 
              title="자동 추출된 투자 정보" 
              size="small" 
              style={{ 
                marginBottom: '16px',
                border: '1px solid #52c41a',
                backgroundColor: '#f6ffed'
              }}
            >
              <Row gutter={[8, 8]}>
                {extractedInfo.investor && (
                  <Col span={6}>
                    <div style={{ fontSize: '12px', color: '#666' }}>투자사</div>
                    <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{extractedInfo.investor}</div>
                  </Col>
                )}
                {extractedInfo.round && (
                  <Col span={6}>
                    <div style={{ fontSize: '12px', color: '#666' }}>투자 라운드</div>
                    <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{extractedInfo.round}</div>
                  </Col>
                )}
                {extractedInfo.sector && (
                  <Col span={6}>
                    <div style={{ fontSize: '12px', color: '#666' }}>투자 섹터</div>
                    <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{extractedInfo.sector}</div>
                  </Col>
                )}
                {extractedInfo.amount && (
                  <Col span={6}>
                    <div style={{ fontSize: '12px', color: '#666' }}>투자 금액</div>
                    <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{extractedInfo.amount}</div>
                  </Col>
                )}
              </Row>
            </Card>
          )}
          
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>기사 본문</span>
                <Space>
                  <Button 
                    size="small" 
                    type="primary" 
                    loading={scrapingContent}
                    onClick={handleScrapeContent}
                    disabled={!article?.id || showManualInput}
                  >
                    {scrapingContent ? '크롤링 중...' : '전체 본문 가져오기'}
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setShowManualInput(true)}
                    disabled={showManualInput}
                  >
                    수동 입력
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => window.open(article?.url, '_blank')}
                    disabled={!article?.url}
                  >
                    원문보기
                  </Button>
                </Space>
              </div>
            }
            size="small" 
            style={{ 
              height: '700px', 
              overflow: 'hidden',
              border: '1px solid #d9d9d9'
            }}
            bodyStyle={{ 
              padding: '12px', 
              height: 'calc(100% - 57px)', 
              overflow: 'auto',
              scrollbarWidth: 'thin'
            }}
          >
            {article && (
              <div>
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ flex: 1, marginRight: 16 }}>{article.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(article.published_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Text>
                  </div>
                </div>
                <div style={{ lineHeight: '1.6', paddingBottom: '20px' }}>
                  {scrapingContent ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>기사 본문을 가져오는 중...</div>
                    </div>
                  ) : showManualInput ? (
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                        크롤링에 실패했습니다. 아래에 기사 본문을 직접 붙여넣어 주세요:
                      </div>
                      <Input.TextArea
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        placeholder="기사 본문을 여기에 붙여넣어 주세요..."
                        rows={15}
                        style={{ marginBottom: '16px' }}
                      />
                      <div style={{ textAlign: 'right' }}>
                        <Space>
                          <Button onClick={handleManualInputCancel}>
                            취소
                          </Button>
                          <Button type="primary" onClick={handleManualContentSubmit}>
                            적용
                          </Button>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    articleContent ? (
                      splitIntoSentences(articleContent).map((sentence, index) => (
                        <div key={index} style={{ marginBottom: 8, padding: '4px 0', display: 'flex' }}>
                          <div style={{ 
                            minWidth: '24px', 
                            marginRight: '8px', 
                            color: '#666', 
                            fontSize: '12px',
                            textAlign: 'right',
                            paddingTop: '2px'
                          }}>
                            {index + 1}.
                          </div>
                          <div style={{ flex: 1 }}>
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: highlightExtractedInfo(sentence) 
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '50px 0', 
                        color: '#999',
                        fontSize: '14px'
                      }}>
                        기사 본문이 없습니다.<br />
                        "전체 본문 가져오기" 버튼을 클릭하여 본문을 가져오세요.
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        {/* 오른쪽: 투자 정보 입력 폼 */}
        <Col span={12}>
          <Card 
            title="처리 유형 선택" 
            size="small" 
            style={{ marginBottom: '16px' }}
          >
            <Radio.Group 
              value={investmentType} 
              onChange={(e) => handleInvestmentTypeChange(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="investment">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>투자 정보</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>스타트업 투자 정보를 입력합니다</div>
                  </div>
                </Radio>
                <Radio value="fund">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>펀드 결성</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>펀드 결성 정보를 입력합니다</div>
                  </div>
                </Radio>
                <Radio value="none">
                  <div>
                    <div style={{ fontWeight: 'bold' }}>상관없음</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>기사만 처리하고 별도 정보를 입력하지 않습니다</div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Card>

          {investmentType === 'investment' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                currency: 'KRW'
              }}
            >
        <Form.Item
          name="startup_name"
          label="스타트업 이름"
          rules={[{ required: true, message: '스타트업 이름을 입력해주세요.' }]}
        >
          <Input placeholder="스타트업 이름을 입력하세요" />
        </Form.Item>

        <Form.Item
          name="investor_name"
          label="투자사 이름"
          rules={[{ required: true, message: '투자사 이름을 입력해주세요.' }]}
        >
          <Input placeholder="투자사 이름을 입력하세요" />
        </Form.Item>

        <Form.Item
          name="round_type"
          label={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>투자 라운드 (선택사항)</span>
              {extractedInfo.round && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#52c41a', 
                  backgroundColor: '#f6ffed', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid #b7eb8f'
                }}>
                  자동 추출: {extractedInfo.round}
                </span>
              )}
            </div>
          }
          rules={[{ required: false, message: '투자 라운드를 선택해주세요.' }]}
        >
          <Select placeholder="투자 라운드를 선택하세요">
            <Option value="시드">시드</Option>
            <Option value="시리즈A">시리즈A</Option>
            <Option value="시리즈B">시리즈B</Option>
            <Option value="시리즈C">시리즈C</Option>
            <Option value="시리즈D">시리즈D</Option>
            <Option value="프리A">프리A</Option>
            <Option value="프리B">프리B</Option>
            <Option value="브릿지">브릿지</Option>
            <Option value="기타">기타</Option>
          </Select>
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="amount"
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>투자 금액 (선택사항)</span>
                {extractedInfo.amount && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#52c41a', 
                    backgroundColor: '#f6ffed', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    border: '1px solid #b7eb8f'
                  }}>
                    자동 추출: {extractedInfo.amount}
                  </span>
                )}
              </div>
            }
            rules={[{ required: false, message: '투자 금액을 입력해주세요.' }]}
            style={{ width: '70%' }}
          >
            <Input placeholder="투자 금액을 입력하세요" />
          </Form.Item>
          <Form.Item
            name="currency"
            label="통화"
            style={{ width: '30%' }}
          >
            <Select>
              <Option value="KRW">KRW</Option>
              <Option value="USD">USD</Option>
              <Option value="EUR">EUR</Option>
              <Option value="JPY">JPY</Option>
            </Select>
          </Form.Item>
        </Space.Compact>

        <Form.Item
          name="sector"
          label={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>섹터</span>
              {extractedInfo.sector && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#52c41a', 
                  backgroundColor: '#f6ffed', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid #b7eb8f'
                }}>
                  자동 추출: {extractedInfo.sector}
                </span>
              )}
            </div>
          }
          rules={[{ required: true, message: '섹터를 입력해주세요.' }]}
        >
          <Input placeholder="섹터를 입력하세요 (예: IT, 헬스케어, 핀테크)" />
        </Form.Item>

        <Form.Item
          name="investment_date"
          label="투자 날짜"
        >
          <Input type="date" />
        </Form.Item>
            </Form>
          )}

          {investmentType === 'fund' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                currency: 'KRW'
              }}
            >
              <Form.Item
                name="fund_name"
                label="펀드명"
                rules={[{ required: true, message: '펀드명을 입력해주세요.' }]}
              >
                <Input placeholder="펀드명을 입력하세요" />
              </Form.Item>

              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="fund_amount"
                  label="펀드 규모"
                  rules={[{ required: true, message: '펀드 규모를 입력해주세요.' }]}
                  style={{ width: '70%' }}
                >
                  <Input placeholder="펀드 규모를 입력하세요" />
                </Form.Item>
                <Form.Item
                  name="fund_currency"
                  label="통화"
                  style={{ width: '30%' }}
                >
                  <Select>
                    <Option value="KRW">KRW</Option>
                    <Option value="USD">USD</Option>
                    <Option value="EUR">EUR</Option>
                    <Option value="JPY">JPY</Option>
                  </Select>
                </Form.Item>
              </Space.Compact>

              <Form.Item
                name="fund_establishment_date"
                label="펀드 결성일"
                rules={[{ required: true, message: '펀드 결성일을 선택해주세요.' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="fund_duration"
                label="펀드 운용기간"
                rules={[{ required: true, message: '펀드 운용기간을 입력해주세요.' }]}
              >
                <Input placeholder="예: 10년, 5년" />
              </Form.Item>

              <Form.Item
                name="fund_end_date"
                label="투자 종료 예정일"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="fund_sector"
                label="투자 섹터"
                rules={[{ required: true, message: '투자 섹터를 입력해주세요.' }]}
              >
                <Input placeholder="투자 섹터를 입력하세요 (예: IT, 헬스케어, 핀테크)" />
              </Form.Item>

              <Form.Item
                name="fund_manager"
                label="펀드 운용사"
                rules={[{ required: true, message: '펀드 운용사를 입력해주세요.' }]}
              >
                <Input placeholder="펀드 운용사를 입력하세요" />
              </Form.Item>
            </Form>
          )}

          {investmentType === 'none' && (
            <Card 
              title="기사 처리 완료" 
              size="small"
              style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                backgroundColor: '#f5f5f5'
              }}
            >
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>
                이 기사는 별도의 투자 정보나 펀드 정보를 입력하지 않고 처리됩니다.
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                기사가 시스템에 저장되어 나중에 참조할 수 있습니다.
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Modal>
  );
};

export default InvestmentInputModal;
