import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  message,
  Button,
  Table,
  Space,
  Typography,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { reportsAPI } from '../services/api';

const { Title } = Typography;

interface Report {
  investor: {
    id: number;
    name: string;
    website?: string;
  };
  report: {
    id: number;
    report_date?: string;
    report_period?: string;
    collected_at?: string;
    company_name?: string;
    ceo?: string;
    phone?: string;
    fax?: string;
    website?: string;
    address?: string;
    registration_date?: string;
    main_investment_areas?: string;
    annual_investments?: Array<{
      year: string;
      amount: string;
      count: string;
    }>;
    initial_startup_investment_amount?: string;
    initial_startup_investment_count?: string;
    initial_startup_average_amount?: string;
    professional_staff?: {
      전문인력?: number;
      투자심사?: number;
      경영지원?: number;
    };
    fund_formations?: Array<{
      name: string;
      registration_date: string;
      deletion_due_date?: string;
      representative_manager?: string;
      fund_manager?: string;
    }>;
    fund_age_distribution?: {
      "0-1yr"?: number;
      "1-2yr"?: number;
      "2-3yr"?: number;
      "3-4yr"?: number;
      "4-5yr"?: number;
    };
  };
}

const ReportView: React.FC = () => {
  const { investorId } = useParams<{ investorId: string }>();
  const history = useHistory();
  const [reportData, setReportData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (investorId) {
      fetchReport(parseInt(investorId));
    }
  }, [investorId]);

  const fetchReport = async (id: number) => {
    setLoading(true);
    try {
      const response = await reportsAPI.getInvestorReport(id);
      setReportData(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.error('보고서를 찾을 수 없습니다.');
        history.push('/reports');
      } else {
        message.error('보고서를 불러오는데 실패했습니다.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string | number | undefined) => {
    if (!num) return '-';
    if (typeof num === 'number') return num.toLocaleString();
    return num;
  };


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <p>보고서를 찾을 수 없습니다.</p>
        <Button onClick={() => history.push('/reports')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined /> {reportData.investor.name} 보고서
            </Title>
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/reports')}>
              목록으로
            </Button>
          </div>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="보고서 기간">
              {reportData.report.report_period || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="보고서 날짜">
              {reportData.report.report_date || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="수집 일시">
              {reportData.report.collected_at
                ? new Date(reportData.report.collected_at).toLocaleString('ko-KR')
                : '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider>회사 정보</Divider>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="회사명">
              {reportData.report.company_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="대표자">
              {reportData.report.ceo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="전화번호">
              {reportData.report.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="팩스번호">
              {reportData.report.fax || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="홈페이지">
              {reportData.report.website ? (
                <a href={reportData.report.website} target="_blank" rel="noopener noreferrer">
                  {reportData.report.website}
                </a>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="주소">
              {reportData.report.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="등록일자">
              {reportData.report.registration_date || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="주요투자분야">
              {reportData.report.main_investment_areas || '-'}
            </Descriptions.Item>
          </Descriptions>

          {reportData.report.annual_investments &&
            reportData.report.annual_investments.length > 0 && (
              <>
                <Divider>연도별 투자 현황</Divider>
                <Table
                  dataSource={reportData.report.annual_investments}
                  columns={[
                    { title: '연도', dataIndex: 'year', key: 'year' },
                    {
                      title: '투자금액',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (text: string) => formatNumber(text),
                    },
                    {
                      title: '투자건수',
                      dataIndex: 'count',
                      key: 'count',
                      render: (text: string) => formatNumber(text),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="year"
                />
              </>
            )}

          {(reportData.report.initial_startup_investment_amount ||
            reportData.report.initial_startup_investment_count) && (
            <>
              <Divider>초기 창업투자기업 투자현황</Divider>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="투자금액">
                  {formatNumber(reportData.report.initial_startup_investment_amount)}
                </Descriptions.Item>
                <Descriptions.Item label="투자건수">
                  {formatNumber(reportData.report.initial_startup_investment_count)}
                </Descriptions.Item>
                <Descriptions.Item label="평균투자금액">
                  {formatNumber(reportData.report.initial_startup_average_amount)}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {reportData.report.professional_staff && (
            <>
              <Divider>전문인력현황</Divider>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="전문인력">
                  {formatNumber(reportData.report.professional_staff.전문인력)}
                </Descriptions.Item>
                <Descriptions.Item label="투자심사">
                  {formatNumber(reportData.report.professional_staff.투자심사)}
                </Descriptions.Item>
                <Descriptions.Item label="경영지원">
                  {formatNumber(reportData.report.professional_staff.경영지원)}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {reportData.report.fund_formations &&
            reportData.report.fund_formations.length > 0 && (
              <>
                <Divider>조합결성현황</Divider>
                        <Table
                          dataSource={reportData.report.fund_formations}
                          columns={[
                            { title: '조합명', dataIndex: 'name', key: 'name', width: '25%' },
                            {
                              title: '등록일',
                              dataIndex: 'registration_date',
                              key: 'registration_date',
                              width: '15%',
                            },
                            {
                              title: '말소예정일',
                              dataIndex: 'deletion_due_date',
                              key: 'deletion_due_date',
                              width: '15%',
                              render: (text: string) => text || '-',
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
                          pagination={false}
                          size="small"
                          rowKey="name"
                          scroll={{ y: 400, x: 800 }}
                        />
              </>
            )}

          {reportData.report.fund_age_distribution && (
            <>
              <Divider>펀드연령별 분포</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="0-1년">
                  {formatNumber(reportData.report.fund_age_distribution['0-1yr'])}
                </Descriptions.Item>
                <Descriptions.Item label="1-2년">
                  {formatNumber(reportData.report.fund_age_distribution['1-2yr'])}
                </Descriptions.Item>
                <Descriptions.Item label="2-3년">
                  {formatNumber(reportData.report.fund_age_distribution['2-3yr'])}
                </Descriptions.Item>
                <Descriptions.Item label="3-4년">
                  {formatNumber(reportData.report.fund_age_distribution['3-4yr'])}
                </Descriptions.Item>
                <Descriptions.Item label="4-5년">
                  {formatNumber(reportData.report.fund_age_distribution['4-5yr'])}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ReportView;

