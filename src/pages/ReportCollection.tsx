import React from 'react';
import { Row, Col, Typography, Result, Button } from 'antd';
import { FileTextOutlined, HomeOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import ReportCollectionProgress from '../components/ReportCollectionProgress';
import DIPAFundCollectionProgress from '../components/DIPAFundCollectionProgress';
import { usePermissions } from '../utils/permissions';

const { Title } = Typography;

const ReportCollection: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();

  // 권한 체크
  if (!hasPermission('access_report_collection')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="보고서 수집 페이지 접근 권한이 없습니다."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
            홈으로 돌아가기
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Title level={2}>
        <FileTextOutlined /> 보고서 수집 관리
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <ReportCollectionProgress />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <DIPAFundCollectionProgress />
        </Col>
      </Row>
    </div>
  );
};

export default ReportCollection;

