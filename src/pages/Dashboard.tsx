import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  BankOutlined, 
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
              title="처리된 기사"
              value={stats?.processed_articles || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${stats?.articles || 0}`}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
