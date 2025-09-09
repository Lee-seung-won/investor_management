import React from 'react';
import { BrowserRouter as Router, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  FundOutlined,
  TagOutlined,
  ApiOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import Articles from './pages/Articles';
import Investments from './pages/Investments';
import Funds from './pages/Funds';
import Labeling from './pages/Labeling';
import APIDocs from './pages/APIDocs';
import LoginModal from './components/LoginModal';
import { UserProvider, useUser } from './contexts/UserContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppContent: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, login, logout, isLoggedIn } = useUser();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '대시보드',
    },
    {
      key: '/investors',
      icon: <BankOutlined />,
      label: '투자사',
    },
    {
      key: '/articles',
      icon: <FileTextOutlined />,
      label: '뉴스 기사',
    },
    {
      key: '/investments',
      icon: <DollarOutlined />,
      label: '투자 정보',
    },
    {
      key: '/funds',
      icon: <FundOutlined />,
      label: '펀드 정보',
    },
    {
      key: '/labeling',
      icon: <TagOutlined />,
      label: '라벨링',
    },
    {
      key: '/api-docs',
      icon: <ApiOutlined />,
      label: 'API 문서',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    history.push(key);
  };

  const handleLogin = (userData: { id: number; name: string }) => {
    // UserContext의 login 함수 호출
    login(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    logout();
  };

  // 로그인하지 않은 경우 로그인 모달 표시
  React.useEffect(() => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    }
  }, [isLoggedIn]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light">
        <div className="logo">
          투자사 뉴스 분석
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#001529' }}>투자사 기반 스타트업 뉴스 분석 시스템</h1>
          {isLoggedIn && user && (
            <Space>
              <Text>
                <UserOutlined /> {user.name}
              </Text>
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </Space>
          )}
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/investors" component={Investors} />
            <Route path="/articles" component={Articles} />
            <Route path="/investments" component={Investments} />
            <Route path="/funds" component={Funds} />
            <Route path="/labeling" component={Labeling} />
            <Route path="/api-docs" component={APIDocs} />
          </Switch>
        </Content>
      </Layout>
      
      <LoginModal
        visible={showLoginModal}
        onLogin={handleLogin}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
};

export default App;
