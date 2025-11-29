import React from 'react';
import { Card, Typography, Result, Button } from 'antd';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import ProfileChangeDetectorProgress from '../components/ProfileChangeDetectorProgress';
import { usePermissions } from '../utils/permissions';

const { Title } = Typography;

const ProfileManagement: React.FC = () => {
  const history = useHistory();
  const { hasPermission } = usePermissions();

  // 권한 체크
  if (!hasPermission('access_profile_management')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="프로필 관리 페이지 접근 권한이 없습니다."
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
      <Title level={2}>
        <UserOutlined /> 프로필 관리
      </Title>
      
      <Card style={{ marginTop: '24px' }}>
        <ProfileChangeDetectorProgress />
      </Card>
    </div>
  );
};

export default ProfileManagement;

