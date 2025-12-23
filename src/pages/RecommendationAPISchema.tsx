import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Collapse,
  Space,
  Button,
  message,
  Divider,
  Alert,
  Row,
  Col,
  Result
} from 'antd';
import { 
  ApiOutlined, 
  CopyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BookOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { usePermissions } from '../utils/permissions';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface RecommendationAPISchemaProps {}

const RecommendationAPISchema: React.FC<RecommendationAPISchemaProps> = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();
  const [copiedText, setCopiedText] = useState<string>('');

  // 권한 체크
  if (!hasPermission('access_recommendation_api_schema')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="추천 API 스키마 페이지 접근 권한이 없습니다."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  // JSON 복사
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      message.success(`${label}이 클립보드에 복사되었습니다.`);
      setTimeout(() => setCopiedText(''), 2000);
    });
  };

  // 전체 응답 예제
  const fullResponseExample = {
    "query": "AI 스타트업에서 시리즈A 투자를 받고 싶어요",
    "matched_investors": [
      {
        "investor_id": 123,
        "investor_name": "테크벤처캐피탈",
        "match_score": 0.892,
        "recommendation_reason": "AI 분야 전문 투자사로, 최근 AI 스타트업 3건 투자 실적이 있으며 시리즈A 단계 투자 경험이 풍부합니다.",
        "sectors": ["IT", "AI", "핀테크"],
        "stage": ["seed", "series-a"],
        "type": "vc",
        "description": "테크 분야 전문 벤처캐피탈",
        "website": "https://example.com",
        "contact": "contact@example.com",
        "email": "contact@example.com",
        "dipa_disclosure_url": "https://diaa.kised.or.kr/...",
        "additional_info": null,
        "profile_text": "테크벤처캐피탈은 AI와 딥테크 분야의 초기 스타트업을 투자하는 벤처캐피털입니다...",
        "recent_investments": [
          {
            "startup_name": "AI테크",
            "round_type": "series-a",
            "amount": 5000000000,
            "currency": "KRW",
            "sector": "AI",
            "investment_date": "2024-01-15T00:00:00",
            "confidence_score": 0.95,
            "article_url": "https://example.com/news/123"
          }
        ],
        "funds": [
          {
            "fund_name": "테크벤처1호",
            "fund_amount": 10000000000,
            "investment_amount": 3000000000,
            "remaining_amount": 7000000000,
            "fund_establishment_date": "2023-06-01T00:00:00",
            "deletion_due_date": "2026-06-01",
            "source": "article",
            "is_region_related": false,
            "article_urls": ["https://example.com/news/fund1"]
          }
        ],
        "fund_summary": {
          "total_fresh_fund_count": 2,
          "total_fresh_fund_amount": 20000000000,
          "total_remaining_amount": 15000000000,
          "region_related_fund_count": 0,
          "region_related_fund_names": []
        },
        "data_mart": {
          "investment_momentum": 0.85,
          "avg_investment_count": 8.5,
          "fresh_fund_count": 2,
          "avg_ticket_size": 5000000000,
          "initial_investment_concentration": 0.75,
          "recent_activity": 12,
          "collection_date": "2024-01-20T00:00:00"
        },
        "other_activities": [
          {
            "event_type": "DemoDay",
            "ac_name": "테크벤처캐피탈",
            "related_company": "AI테크",
            "summary": "포트폴리오 기업 DemoDay 개최",
            "date": "2024-01-10T00:00:00",
            "article_url": "https://example.com/news/demoday"
          }
        ],
        "diaa_report": {
          "report_date": "2024-09",
          "report_period": "2024-09 수시공시",
          "company_name": "테크벤처캐피탈",
          "ceo": "홍길동",
          "phone": "02-1234-5678",
          "website": "https://example.com",
          "address": "서울특별시 강남구...",
          "main_investment_areas": "AI, 딥테크, 핀테크",
          "annual_investments": [
            {"year": "2023", "amount": "50,000,000,000", "count": 10}
          ],
          "initial_startup_investment_amount": "30,000,000,000",
          "initial_startup_investment_count": "8",
          "initial_startup_average_amount": "3,750,000,000",
          "professional_staff": {
            "전문인력": 9,
            "투자심사": 9,
            "경영지원": 0
          }
        }
      }
    ],
    "total_found": 25,
    "algorithm_version": "3.0",
    "extracted_info": {
      "sectors": ["AI"],
      "region": null
    }
  };

  // 최상위 응답 필드 설명
  const topLevelFields = [
    {
      key: 'query',
      type: 'string',
      required: true,
      description: '사용자가 입력한 원본 쿼리'
    },
    {
      key: 'matched_investors',
      type: 'InvestorMatch[]',
      required: true,
      description: '매칭된 투자사 목록 (배열)'
    },
    {
      key: 'total_found',
      type: 'number',
      required: true,
      description: '전체 매칭된 투자사 수'
    },
    {
      key: 'algorithm_version',
      type: 'string',
      required: true,
      description: '알고리즘 버전 (현재: "3.0")'
    },
    {
      key: 'extracted_info',
      type: 'ExtractedInfo',
      required: true,
      description: 'LLM이 추출한 섹터 및 지역 정보'
    }
  ];

  // InvestorMatch 필드 설명
  // 필수 필드: investor_id, investor_name, match_score, recommendation_reason, sectors, type, recent_investments, funds, other_activities
  // 선택 필드: stage, description, website, contact, email, dipa_disclosure_url, additional_info, profile_text, fund_summary, data_mart, diaa_report
  const investorMatchFields = [
    {
      key: 'investor_id',
      type: 'number',
      required: true,
      description: '투자사 고유 ID (필수)'
    },
    {
      key: 'investor_name',
      type: 'string',
      required: true,
      description: '투자사 이름 (필수)'
    },
    {
      key: 'match_score',
      type: 'number',
      required: true,
      description: '종합 매칭 점수 (0.0 ~ 1.0) (필수)'
    },
    {
      key: 'recommendation_reason',
      type: 'string',
      required: true,
      description: 'LLM이 생성한 추천 사유 (필수)'
    },
    {
      key: 'sectors',
      type: 'string[]',
      required: true,
      description: '투자 섹터 리스트 (필수, 빈 배열일 수 있음)'
    },
    {
      key: 'type',
      type: 'string',
      required: true,
      description: '투자사 유형 (accelerator, vc, corporate 등) (필수)'
    },
    {
      key: 'recent_investments',
      type: 'Investment[]',
      required: true,
      description: '최근 투자 기록 배열 (필수, 빈 배열일 수 있음, 최대 10개)'
    },
    {
      key: 'funds',
      type: 'Fund[]',
      required: true,
      description: '싱싱한 펀드 정보 배열 (필수, 빈 배열일 수 있음, 3년 이내 + 활성 펀드만)'
    },
    {
      key: 'other_activities',
      type: 'OtherActivity[]',
      required: true,
      description: '기타 활동 정보 배열 (필수, 빈 배열일 수 있음, 최대 10개)'
    },
    {
      key: 'stage',
      type: 'string[] | null',
      required: false,
      description: '투자 단계 리스트 (선택, seed, series-a 등)'
    },
    {
      key: 'description',
      type: 'string | null',
      required: false,
      description: '투자사 설명 (선택)'
    },
    {
      key: 'website',
      type: 'string | null',
      required: false,
      description: '웹사이트 URL (선택)'
    },
    {
      key: 'contact',
      type: 'string | null',
      required: false,
      description: '연락처 (선택)'
    },
    {
      key: 'email',
      type: 'string | null',
      required: false,
      description: '이메일 주소 (선택)'
    },
    {
      key: 'dipa_disclosure_url',
      type: 'string | null',
      required: false,
      description: 'DIPA 공시 페이지 URL (선택)'
    },
    {
      key: 'additional_info',
      type: 'object | null',
      required: false,
      description: '기타 정보 (JSON 객체) (선택)'
    },
    {
      key: 'profile_text',
      type: 'string | null',
      required: false,
      description: '프로필 텍스트 (임베딩용) (선택)'
    },
    {
      key: 'fund_summary',
      type: 'FundSummary | null',
      required: false,
      description: '펀드 요약 정보 (선택, 펀드가 있을 때만 제공)'
    },
    {
      key: 'data_mart',
      type: 'DataMart | null',
      required: false,
      description: 'DataMart 지표 정보 (선택, 데이터가 있을 때만 제공)'
    },
    {
      key: 'diaa_report',
      type: 'DiaaReport | null',
      required: false,
      description: 'DIAA 보고서 정보 (선택, 최신 보고서가 있을 때만 제공)'
    }
  ];

  // Investment 필드 설명
  // 모든 필드가 선택적이지만, 배열 자체는 항상 존재 (빈 배열일 수 있음)
  const investmentFields = [
    { key: 'startup_name', type: 'string', required: false, description: '스타트업명 (선택)' },
    { key: 'round_type', type: 'string | null', required: false, description: '투자 라운드 (seed, series-a 등) (선택)' },
    { key: 'amount', type: 'number | null', required: false, description: '투자 금액 (원 단위) (선택)' },
    { key: 'currency', type: 'string', required: false, description: '통화 (기본: KRW) (선택)' },
    { key: 'sector', type: 'string | null', required: false, description: '섹터 (선택)' },
    { key: 'investment_date', type: 'string | null', required: false, description: '투자 날짜 (ISO 8601 형식) (선택)' },
    { key: 'confidence_score', type: 'number | null', required: false, description: '추출 신뢰도 (0.0 ~ 1.0) (선택)' },
    { key: 'article_url', type: 'string | null', required: false, description: '연결된 뉴스 기사 링크 (선택)' }
  ];

  // Fund 필드 설명
  // 모든 필드가 선택적이지만, 배열 자체는 항상 존재 (빈 배열일 수 있음)
  const fundFields = [
    { key: 'fund_name', type: 'string', required: false, description: '펀드명 (선택)' },
    { key: 'fund_amount', type: 'number', required: false, description: '펀드 규모 (결성총액, 원 단위) (선택)' },
    { key: 'investment_amount', type: 'number', required: false, description: '투자금액 (원 단위) (선택)' },
    { key: 'remaining_amount', type: 'number', required: false, description: '잔여금액 (원 단위) (선택)' },
    { key: 'fund_establishment_date', type: 'string | null', required: false, description: '펀드 결성일 (ISO 8601 형식) (선택)' },
    { key: 'deletion_due_date', type: 'string | null', required: false, description: '말소예정일 (YYYY-MM-DD 형식) (선택)' },
    { key: 'source', type: 'string', required: false, description: '데이터 출처 (article 또는 diaa) (선택)' },
    { key: 'is_region_related', type: 'boolean', required: false, description: '지역 관련 펀드 여부 (선택)' },
    { key: 'article_urls', type: 'string[]', required: false, description: '연결된 뉴스 기사 링크 리스트 (선택, 빈 배열일 수 있음)' }
  ];

  // FundSummary 필드 설명
  // fund_summary 객체 자체는 선택적이지만, 존재할 경우 내부 필드는 모두 존재
  const fundSummaryFields = [
    { key: 'total_fresh_fund_count', type: 'number', required: false, description: '총 싱싱한 펀드 수 (fund_summary가 있을 때만)' },
    { key: 'total_fresh_fund_amount', type: 'number', required: false, description: '총 펀드 규모 (원 단위) (fund_summary가 있을 때만)' },
    { key: 'total_remaining_amount', type: 'number', required: false, description: '총 잔여금액 (원 단위) (fund_summary가 있을 때만)' },
    { key: 'region_related_fund_count', type: 'number', required: false, description: '지역 관련 펀드 수 (fund_summary가 있을 때만)' },
    { key: 'region_related_fund_names', type: 'string[]', required: false, description: '지역 관련 펀드명 리스트 (fund_summary가 있을 때만)' }
  ];

  // DataMart 필드 설명
  // data_mart 객체 자체는 선택적이지만, 존재할 경우 내부 필드는 모두 존재 (값은 null일 수 있음)
  const dataMartFields = [
    { key: 'investment_momentum', type: 'number | null', required: false, description: '투자 모멘텀 (0.0 ~ 1.0 이상) (data_mart가 있을 때만)' },
    { key: 'avg_investment_count', type: 'number | null', required: false, description: '연평균 투자건수 (data_mart가 있을 때만)' },
    { key: 'fresh_fund_count', type: 'number | null', required: false, description: '싱싱한 펀드 수 (data_mart가 있을 때만)' },
    { key: 'avg_ticket_size', type: 'number | null', required: false, description: '평균 티켓 사이즈 (원 단위) (data_mart가 있을 때만)' },
    { key: 'initial_investment_concentration', type: 'number | null', required: false, description: '초기 투자 집중도 (0.0 ~ 1.0) (data_mart가 있을 때만)' },
    { key: 'recent_activity', type: 'number | null', required: false, description: '최근 활동성 (건수) (data_mart가 있을 때만)' },
    { key: 'collection_date', type: 'string | null', required: false, description: '수집 날짜 (ISO 8601 형식) (data_mart가 있을 때만)' }
  ];

  // OtherActivity 필드 설명
  // 모든 필드가 선택적이지만, 배열 자체는 항상 존재 (빈 배열일 수 있음)
  const otherActivityFields = [
    { key: 'event_type', type: 'string', required: false, description: '활동 종류 (DemoDay, MOU, 파트너십, 투자금 회수, 엑싯 등) (선택)' },
    { key: 'ac_name', type: 'string', required: false, description: '활동 주체 AC 이름 (선택)' },
    { key: 'related_company', type: 'string | null', required: false, description: '협력 기업 (선택)' },
    { key: 'summary', type: 'string', required: false, description: '활동 내용 요약 (선택)' },
    { key: 'date', type: 'string | null', required: false, description: '활동 날짜 (ISO 8601 형식) (선택)' },
    { key: 'article_url', type: 'string | null', required: false, description: '연결된 뉴스 기사 링크 (선택)' }
  ];

  // DiaaReport 필드 설명
  // diaa_report 객체 자체는 선택적이지만, 존재할 경우 내부 필드는 모두 존재 (값은 null일 수 있음)
  const diaaReportFields = [
    { key: 'report_date', type: 'string | null', required: false, description: '보고서 날짜 (예: "2024-09") (diaa_report가 있을 때만)' },
    { key: 'report_period', type: 'string | null', required: false, description: '보고서 기간 (예: "2024-09 수시공시") (diaa_report가 있을 때만)' },
    { key: 'company_name', type: 'string | null', required: false, description: '회사명 (diaa_report가 있을 때만)' },
    { key: 'ceo', type: 'string | null', required: false, description: 'CEO (diaa_report가 있을 때만)' },
    { key: 'phone', type: 'string | null', required: false, description: '전화번호 (diaa_report가 있을 때만)' },
    { key: 'website', type: 'string | null', required: false, description: '웹사이트 (diaa_report가 있을 때만)' },
    { key: 'address', type: 'string | null', required: false, description: '주소 (diaa_report가 있을 때만)' },
    { key: 'main_investment_areas', type: 'string | null', required: false, description: '주요 투자 분야 (diaa_report가 있을 때만)' },
    { key: 'annual_investments', type: 'object[] | null', required: false, description: '연도별 투자 정보 (JSON 배열) (diaa_report가 있을 때만)' },
    { key: 'initial_startup_investment_amount', type: 'string | null', required: false, description: '초기 창업투자기업 투자금액 (diaa_report가 있을 때만)' },
    { key: 'initial_startup_investment_count', type: 'string | null', required: false, description: '초기 창업투자기업 투자건수 (diaa_report가 있을 때만)' },
    { key: 'initial_startup_average_amount', type: 'string | null', required: false, description: '초기 창업투자기업 평균투자금액 (diaa_report가 있을 때만)' },
    { key: 'professional_staff', type: 'object | null', required: false, description: '전문인력현황 (JSON 객체) (diaa_report가 있을 때만)' }
  ];

  // ExtractedInfo 필드 설명
  // extracted_info 객체 자체는 필수이지만, 내부 필드는 모두 선택적 (null일 수 있음)
  const extractedInfoFields = [
    { key: 'sectors', type: 'string[] | null', required: false, description: '추출된 섹터 리스트 (선택, LLM이 추출하지 못하면 null)' },
    { key: 'region', type: 'string | null', required: false, description: '추출된 지역명 (선택, LLM이 추출하지 못하면 null)' }
  ];

  const renderFieldTable = (fields: any[]) => {
    return (
      <Table
        dataSource={fields}
        columns={[
          {
            title: '필드명',
            dataIndex: 'key',
            key: 'key',
            width: '25%',
            render: (text) => <code style={{ color: '#1890ff' }}>{text}</code>
          },
          {
            title: '타입',
            dataIndex: 'type',
            key: 'type',
            width: '25%',
            render: (text) => <Tag color="blue">{text}</Tag>
          },
          {
            title: '필수/선택',
            dataIndex: 'required',
            key: 'required',
            width: '12%',
            render: (required) => required ? <Tag color="red">필수</Tag> : <Tag color="default">선택</Tag>
          },
          {
            title: '설명',
            dataIndex: 'description',
            key: 'description',
            width: '38%'
          }
        ]}
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <BookOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <Title level={2}>추천 API JSON 스키마 문서</Title>
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            프론트엔드에서 추천 API를 사용하기 위한 상세한 JSON 응답 구조 설명
          </Paragraph>
        </div>

        {/* API 요청 형식 섹션 */}
        <Card title="📨 API 요청 형식" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Paragraph style={{ marginBottom: '16px' }}>
                <Text strong>엔드포인트:</Text> <code>POST /api/matching/match</code>
              </Paragraph>
              <Paragraph style={{ marginBottom: '16px' }}>
                <Text strong>Content-Type:</Text> <code>application/json</code>
              </Paragraph>
              
              <Divider>요청 파라미터</Divider>
              
              <Table
                dataSource={[
                  {
                    key: 'prompt',
                    field: 'prompt',
                    type: 'string',
                    required: true,
                    description: '자연어 프롬프트 (투자 요청 내용)',
                    example: '"AI 스타트업에서 투자를 받고 싶어요"'
                  },
                  {
                    key: 'top_k',
                    field: 'top_k',
                    type: 'number',
                    required: false,
                    description: '반환할 투자사 수 (기본값: 10, 최대: 100)',
                    example: '5'
                  },
                  {
                    key: 'min_confidence',
                    field: 'min_confidence',
                    type: 'number',
                    required: false,
                    description: '최소 매칭 점수 (기본값: 0.0, 범위: 0.0 ~ 1.0)',
                    example: '0.3'
                  }
                ]}
                columns={[
                  {
                    title: '필드명',
                    dataIndex: 'field',
                    key: 'field',
                    width: '20%',
                    render: (text) => <code style={{ color: '#1890ff' }}>{text}</code>
                  },
                  {
                    title: '타입',
                    dataIndex: 'type',
                    key: 'type',
                    width: '15%',
                    render: (text) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: '필수/선택',
                    dataIndex: 'required',
                    key: 'required',
                    width: '12%',
                    render: (required) => required ? <Tag color="red">필수</Tag> : <Tag color="default">선택</Tag>
                  },
                  {
                    title: '설명',
                    dataIndex: 'description',
                    key: 'description',
                    width: '28%'
                  },
                  {
                    title: '예시',
                    dataIndex: 'example',
                    key: 'example',
                    width: '25%',
                    render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>
                  }
                ]}
                pagination={false}
                size="small"
                style={{ marginBottom: '24px' }}
              />
              
              <Divider>요청 본문 (Request Body)</Divider>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong>기본 요청 형식:</Text>
                <div style={{ position: 'relative', marginTop: '8px' }}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(JSON.stringify({
                      prompt: "AI 스타트업에서 투자를 받고 싶어요",
                      top_k: 5,
                      min_confidence: 0.3
                    }, null, 2), '기본 요청 JSON')}
                    style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                  >
                    {copiedText === '기본 요청 JSON' ? <CheckCircleOutlined /> : <CopyOutlined />}
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
                style={{ marginTop: '16px', marginBottom: '16px' }}
              />

              <Divider>코드 예제</Divider>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Title level={5}>cURL 예제</Title>
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateCurlExample(), 'cURL 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'cURL 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px', 
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {generateCurlExample()}
                    </pre>
                  </div>
                </Col>
                <Col span={12}>
                  <Title level={5}>Python 예제</Title>
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generatePythonExample(), 'Python 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'Python 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px', 
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {generatePythonExample()}
                    </pre>
                  </div>
                </Col>
                <Col span={12}>
                  <Title level={5}>JavaScript (Fetch) 예제</Title>
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateJavaScriptExample(), 'JavaScript 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'JavaScript 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px', 
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {generateJavaScriptExample()}
                    </pre>
                  </div>
                </Col>
                <Col span={12}>
                  <Title level={5}>TypeScript (Axios) 예제</Title>
                  <div style={{ position: 'relative' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(generateTypeScriptExample(), 'TypeScript 예제')}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                    >
                      {copiedText === 'TypeScript 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                    </Button>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px', 
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {generateTypeScriptExample()}
                    </pre>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Collapse defaultActiveKey={['1', '2']} style={{ marginBottom: '24px' }}>
          {/* 최상위 응답 구조 */}
          <Panel header="1. 최상위 응답 구조 (MatchingResponse)" key="1">
            <Paragraph>
              API 호출 시 반환되는 최상위 객체 구조입니다.
            </Paragraph>
            {renderFieldTable(topLevelFields)}
          </Panel>

          {/* InvestorMatch 구조 */}
          <Panel header="2. 투자사 매칭 결과 (InvestorMatch)" key="2">
            <Paragraph>
              <code>matched_investors</code> 배열의 각 요소 구조입니다.
            </Paragraph>
            {renderFieldTable(investorMatchFields)}
          </Panel>

          {/* Investment 구조 */}
          <Panel header="3. 투자 이력 (Investment)" key="3">
            <Paragraph>
              <code>recent_investments</code> 배열의 각 요소 구조입니다.
            </Paragraph>
            {renderFieldTable(investmentFields)}
          </Panel>

          {/* Fund 구조 */}
          <Panel header="4. 펀드 정보 (Fund)" key="4">
            <Paragraph>
              <code>funds</code> 배열의 각 요소 구조입니다. 3년 이내에 결성되고 활성 상태인 "싱싱한 펀드"만 포함됩니다.
            </Paragraph>
            {renderFieldTable(fundFields)}
          </Panel>

          {/* FundSummary 구조 */}
          <Panel header="5. 펀드 요약 정보 (FundSummary)" key="5">
            <Paragraph>
              <code>fund_summary</code> 객체 구조입니다.
            </Paragraph>
            {renderFieldTable(fundSummaryFields)}
          </Panel>

          {/* DataMart 구조 */}
          <Panel header="6. DataMart 지표 (DataMart)" key="6">
            <Paragraph>
              <code>data_mart</code> 객체 구조입니다. 투자사별 계산된 지표 정보입니다.
            </Paragraph>
            {renderFieldTable(dataMartFields)}
          </Panel>

          {/* OtherActivity 구조 */}
          <Panel header="7. 기타 활동 정보 (OtherActivity)" key="7">
            <Paragraph>
              <code>other_activities</code> 배열의 각 요소 구조입니다. 최근 10개 활동만 포함됩니다.
            </Paragraph>
            {renderFieldTable(otherActivityFields)}
          </Panel>

          {/* DiaaReport 구조 */}
          <Panel header="8. DIAA 보고서 정보 (DiaaReport)" key="8">
            <Paragraph>
              <code>diaa_report</code> 객체 구조입니다. 최신 보고서 정보만 포함됩니다.
            </Paragraph>
            {renderFieldTable(diaaReportFields)}
          </Panel>

          {/* ExtractedInfo 구조 */}
          <Panel header="9. 추출된 정보 (ExtractedInfo)" key="9">
            <Paragraph>
              <code>extracted_info</code> 객체 구조입니다. LLM이 사용자 쿼리에서 추출한 섹터 및 지역 정보입니다.
            </Paragraph>
            {renderFieldTable(extractedInfoFields)}
          </Panel>
        </Collapse>

        {/* 전체 JSON 예제 */}
        <Card 
          title="전체 JSON 응답 예제" 
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(JSON.stringify(fullResponseExample, null, 2), '전체 JSON 예제')}
            >
              {copiedText === '전체 JSON 예제' ? <CheckCircleOutlined /> : <CopyOutlined />} 복사
            </Button>
          }
        >
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px', 
            margin: 0,
            maxHeight: '600px',
            overflow: 'auto',
            fontSize: '12px',
            lineHeight: '1.5',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace'
          }}>
            {JSON.stringify(fullResponseExample, null, 2)}
          </pre>
        </Card>

        <Divider />

        {/* 사용 예시 */}
        <Card title="프론트엔드 사용 예시">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4}>TypeScript 타입 정의</Title>
              <div style={{ position: 'relative' }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(typescriptExample, 'TypeScript 예제')}
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                >
                  {copiedText === 'TypeScript 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                </Button>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace'
                }}>
                  {typescriptExample}
                </pre>
              </div>
            </Col>
            <Col span={24}>
              <Title level={4}>React 컴포넌트 예시</Title>
              <div style={{ position: 'relative' }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(reactExample, 'React 예제')}
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
                >
                  {copiedText === 'React 예제' ? <CheckCircleOutlined /> : <CopyOutlined />}
                </Button>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace'
                }}>
                  {reactExample}
                </pre>
              </div>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* 주의사항 */}
        <Card title="필수/선택 필드 요약 및 주의사항">
          <Alert
            message="필수 필드 (항상 존재)"
            description={
              <div>
                <Text strong>최상위 응답:</Text> query, matched_investors, total_found, algorithm_version, extracted_info
                <br />
                <Text strong>InvestorMatch:</Text> investor_id, investor_name, match_score, recommendation_reason, sectors, type, recent_investments, funds, other_activities
                <br />
                <Text type="secondary">※ recent_investments, funds, other_activities는 항상 배열로 존재하지만 빈 배열일 수 있습니다.</Text>
              </div>
            }
            type="success"
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="선택 필드 (null일 수 있음)"
            description={
              <div>
                <Text strong>InvestorMatch:</Text> stage, description, website, contact, email, dipa_disclosure_url, additional_info, profile_text, fund_summary, data_mart, diaa_report
                <br />
                <Text type="secondary">※ fund_summary, data_mart, diaa_report는 객체 자체가 null일 수 있으며, 존재할 경우 내부 필드는 모두 존재합니다 (값은 null일 수 있음).</Text>
              </div>
            }
            type="warning"
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="null 값 처리"
            description="선택 필드는 null일 수 있습니다. 항상 null 체크를 수행하세요. 특히 fund_summary, data_mart, diaa_report는 객체 자체가 null일 수 있습니다."
            type="warning"
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="배열 필드"
            description="recent_investments, funds, other_activities는 항상 배열로 존재하지만 빈 배열([])일 수 있습니다. 배열 내 요소의 필드는 모두 선택적입니다."
            type="info"
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="날짜 형식"
            description="모든 날짜는 ISO 8601 형식 (예: '2024-01-15T00:00:00') 또는 문자열 형식입니다."
            type="info"
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="금액 단위"
            description="모든 금액은 원(KRW) 단위입니다. 천 단위 구분자 없이 숫자로 제공됩니다."
            type="info"
          />
        </Card>
      </Card>
    </div>
  );
};

// TypeScript 타입 정의 예제
const typescriptExample = `// API 응답 타입 정의
interface ExtractedInfo {
  sectors: string[] | null;
  region: string | null;
}

interface Investment {
  startup_name: string;
  round_type: string | null;
  amount: number | null;
  currency: string;
  sector: string | null;
  investment_date: string | null;
  confidence_score: number | null;
  article_url: string | null;
}

interface Fund {
  fund_name: string;
  fund_amount: number;
  investment_amount: number;
  remaining_amount: number;
  fund_establishment_date: string | null;
  deletion_due_date: string | null;
  source: string;
  is_region_related: boolean;
  article_urls: string[];
}

interface FundSummary {
  total_fresh_fund_count: number;
  total_fresh_fund_amount: number;
  total_remaining_amount: number;
  region_related_fund_count: number;
  region_related_fund_names: string[];
}

interface DataMart {
  investment_momentum: number | null;
  avg_investment_count: number | null;
  fresh_fund_count: number | null;
  avg_ticket_size: number | null;
  initial_investment_concentration: number | null;
  recent_activity: number | null;
  collection_date: string | null;
}

interface OtherActivity {
  event_type: string;
  ac_name: string;
  related_company: string | null;
  summary: string;
  date: string | null;
  article_url: string | null;
}

interface DiaaReport {
  report_date: string | null;
  report_period: string | null;
  company_name: string | null;
  ceo: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  main_investment_areas: string | null;
  annual_investments: any[] | null;
  initial_startup_investment_amount: string | null;
  initial_startup_investment_count: string | null;
  initial_startup_average_amount: string | null;
  professional_staff: any | null;
}

interface InvestorMatch {
  investor_id: number;
  investor_name: string;
  match_score: number;
  recommendation_reason: string;
  sectors: string[];
  stage: string[] | null;
  type: string;
  description: string | null;
  website: string | null;
  contact: string | null;
  email: string | null;
  dipa_disclosure_url: string | null;
  additional_info: any | null;
  profile_text: string | null;
  recent_investments: Investment[];
  funds: Fund[];
  fund_summary: FundSummary | null;
  data_mart: DataMart | null;
  other_activities: OtherActivity[];
  diaa_report: DiaaReport | null;
}

interface MatchingResponse {
  query: string;
  matched_investors: InvestorMatch[];
  total_found: number;
  algorithm_version: string;
  extracted_info: ExtractedInfo;
}`;

// React 컴포넌트 예제
const reactExample = `import React, { useState } from 'react';
import axios from 'axios';

const RecommendationComponent: React.FC = () => {
  const [investors, setInvestors] = useState<InvestorMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async (prompt: string) => {
    setLoading(true);
    try {
      const response = await axios.post<MatchingResponse>(
        '/api/matching/match',
        {
          prompt: prompt,
          top_k: 10,
          min_confidence: 0.3
        }
      );
      
      setInvestors(response.data.matched_investors);
      
      // 추출된 정보 확인
      console.log('추출된 섹터:', response.data.extracted_info.sectors);
      console.log('추출된 지역:', response.data.extracted_info.region);
      
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {investors.map((investor) => (
        <div key={investor.investor_id}>
          <h3>{investor.investor_name}</h3>
          <p>점수: {investor.match_score}</p>
          <p>{investor.recommendation_reason}</p>
          
          {/* 투자 이력 */}
          {investor.recent_investments.length > 0 && (
            <div>
              <h4>최근 투자</h4>
              {investor.recent_investments.map((inv, idx) => (
                <div key={idx}>
                  {inv.startup_name} - {inv.round_type}
                  {inv.article_url && (
                    <a href={inv.article_url} target="_blank" rel="noopener noreferrer">
                      기사 보기
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 펀드 정보 */}
          {investor.funds.length > 0 && (
            <div>
              <h4>활성 펀드</h4>
              {investor.funds.map((fund, idx) => (
                <div key={idx}>
                  {fund.fund_name} - 잔여: {fund.remaining_amount.toLocaleString()}원
                </div>
              ))}
            </div>
          )}
          
          {/* DataMart 지표 */}
          {investor.data_mart && (
            <div>
              <h4>투자 지표</h4>
              <p>투자 모멘텀: {investor.data_mart.investment_momentum}</p>
              <p>최근 활동성: {investor.data_mart.recent_activity}건</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecommendationComponent;`;

// 코드 예제 생성 함수들
const generateCurlExample = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
  return `curl -X POST "${baseUrl}/api/matching/match" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "AI 스타트업에서 투자를 받고 싶어요",
    "top_k": 5,
    "min_confidence": 0.3
  }'`;
};

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
});`;
};

const generateTypeScriptExample = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://web-production-7d32.up.railway.app';
  return `// Axios 사용
import axios from 'axios';

interface MatchingRequest {
    prompt: string;
    top_k?: number;
    min_confidence?: number;
}

interface MatchingResponse {
    query: string;
    matched_investors: InvestorMatch[];
    total_found: number;
    algorithm_version: string;
    extracted_info: {
        sectors: string[] | null;
        region: string | null;
    };
}

const apiUrl = "${baseUrl}/api/matching/match";

const requestData: MatchingRequest = {
    prompt: "AI 스타트업에서 투자를 받고 싶어요",
    top_k: 5,
    min_confidence: 0.3
};

axios.post<MatchingResponse>(apiUrl, requestData)
    .then(response => {
        const data = response.data;
        console.log(\`총 \${data.total_found}개의 투자사 중 상위 \${data.matched_investors.length}개:\`);
        
        data.matched_investors.forEach((investor, index) => {
            console.log(\`\${index + 1}. \${investor.investor_name} (점수: \${investor.match_score})\`);
            console.log(\`   섹터: \${investor.sectors.join(', ')}\`);
            console.log(\`   추천 사유: \${investor.recommendation_reason}\`);
        });
    })
    .catch(error => {
        console.error('오류 발생:', error);
    });`;
};

export default RecommendationAPISchema;
