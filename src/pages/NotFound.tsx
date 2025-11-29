import React from 'react';
import { Result, Button } from 'antd';
import { useHistory } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <Result
      status="404"
      title="404"
      subTitle="페이지를 찾을 수 없습니다."
      extra={
        <Button type="primary" icon={<HomeOutlined />} onClick={() => history.push('/')}>
          홈으로 돌아가기
        </Button>
      }
    />
  );
};

export default NotFound;

