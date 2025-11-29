import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  FileTextOutlined, 
  BankOutlined, 
  DollarOutlined, 
  CheckCircleOutlined
} from '@ant-design/icons';
import { systemAPI } from '../services/api.ts';
import { Stats } from '../types/index';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await systemAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('통계 데이터를 불러오는데 실패했습니다.', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 투자사"
              value={stats?.investors || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="총 기사"
              value={stats?.articles || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="처리된 기사"
              value={stats?.processed_articles || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${stats?.articles || 0}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="추출된 투자 정보"
              value={stats?.investments || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="처리 현황">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="처리율"
                  value={stats ? (stats.processed_articles / stats.articles * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="검수율"
                  value={stats ? (stats.verified_investments / stats.investments * 100) : 0}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="수동 처리"
                  value={stats?.investments || 0}
                  suffix="건"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="펀드 정보"
                  value={stats?.funds || 0}
                  suffix="건"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="시스템 정보">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {stats?.investors || 0}
                  </div>
                  <div style={{ color: '#666' }}>등록된 투자사</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {stats?.startups || 0}
                  </div>
                  <div style={{ color: '#666' }}>등록된 스타트업</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                    {stats?.verified_investments || 0}
                  </div>
                  <div style={{ color: '#666' }}>검수 완료 투자 정보</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
