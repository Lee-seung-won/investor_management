import React from 'react';
import { BrowserRouter as Router, Route, Switch, useHistory, useLocation, Redirect } from 'react-router-dom';
import { Layout, Menu, Button, Space, Typography, Spin, message } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  FundOutlined,
  TagOutlined,
  ApiOutlined,
  FileSearchOutlined,
  CloudDownloadOutlined,
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  BookOutlined
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import Articles from './pages/Articles';
import Investments from './pages/Investments';
import Funds from './pages/Funds';
import OtherActivities from './pages/OtherActivities';
import Labeling from './pages/Labeling';
import APIDocs from './pages/APIDocs';
import RecommendationAPISchema from './pages/RecommendationAPISchema';
import Reports from './pages/Reports';
import ReportView from './pages/ReportView';
import Blacklist from './pages/Blacklist';
import CrawlingFailedDomains from './pages/CrawlingFailedDomains';
import ProfileManagement from './pages/ProfileManagement';
import NewsCollection from './pages/NewsCollection';
import FundArticles from './pages/FundArticles';
import ReportCollection from './pages/ReportCollection';
import DataMart from './pages/DataMart';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePermissions } from './utils/permissions';
import { LockOutlined } from '@ant-design/icons';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

// PrivateRoute 컴포넌트 - 인증된 사용자만 접근 가능
const PrivateRoute: React.FC<{ path: string; exact?: boolean; component: React.ComponentType<any> }> = ({ 
  path, 
  exact, 
  component: Component 
}) => {
  return (
    <Route 
      path={path} 
      exact={exact}
      render={(props) => <Component {...props} />}
    />
  );
};

// AdminRoute 컴포넌트 - 어드민만 접근 가능
const AdminRoute: React.FC<{ path: string; exact?: boolean; component: React.ComponentType<any> }> = ({ 
  path, 
  exact, 
  component: Component 
}) => {
  const { user } = useAuth();
  
  return (
    <Route 
      path={path} 
      exact={exact}
      render={(props) => {
        // 어드민이 아니면 404 페이지 표시
        if (user?.role !== 'admin') {
          return <NotFound />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

const AppContent: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const { hasPermission } = usePermissions();

  // 인증 확인 중일 때는 로딩 화면 표시
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>인증 확인 중...</div>
      </div>
    );
  }

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
      key: '/profile-management',
      icon: hasPermission('access_profile_management') ? <UserOutlined /> : <LockOutlined />,
      label: '프로필 관리',
      style: hasPermission('access_profile_management') ? {} : { color: '#722ed1' },
    },
    // 구분선: 기본 정보 그룹 끝
    {
      type: 'divider' as const,
    },
    {
      key: '/articles',
      icon: <FileTextOutlined />,
      label: '뉴스 기사',
    },
    {
      key: '/fund-articles',
      icon: <FileTextOutlined />,
      label: '펀드 기사',
    },
    {
      key: '/news-collection',
      icon: <CloudDownloadOutlined />,
      label: '뉴스 수집',
    },
    {
      key: '/report-collection',
      icon: hasPermission('access_report_collection') ? <CloudDownloadOutlined /> : <LockOutlined />,
      label: '보고서 수집',
      style: hasPermission('access_report_collection') ? {} : { color: '#722ed1' },
    },
    // 구분선: 수집 관련 그룹 끝
    {
      type: 'divider' as const,
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
      key: '/other-activities',
      icon: <TagOutlined />,
      label: '활동 이력',
    },
    {
      key: '/reports',
      icon: hasPermission('access_reports') ? <FileSearchOutlined /> : <LockOutlined />,
      label: '보고서',
      style: hasPermission('access_reports') ? {} : { color: '#722ed1' },
    },
    // 구분선: 데이터 관리 그룹 끝
    {
      type: 'divider' as const,
    },
    {
      key: '/labeling',
      icon: hasPermission('access_labeling') ? <TagOutlined /> : <LockOutlined />,
      label: '라벨링',
      style: hasPermission('access_labeling') ? {} : { color: '#722ed1' },
    },
    {
      key: '/api-docs',
      icon: hasPermission('access_api_docs') ? <ApiOutlined /> : <LockOutlined />,
      label: 'API 문서',
      style: hasPermission('access_api_docs') ? {} : { color: '#722ed1' },
    },
    {
      key: '/recommendation-api-schema',
      icon: hasPermission('access_recommendation_api_schema') ? <BookOutlined /> : <LockOutlined />,
      label: '추천 API 스키마',
      style: hasPermission('access_recommendation_api_schema') ? {} : { color: '#722ed1' },
    },
    {
      key: '/data-mart',
      icon: <DatabaseOutlined />,
      label: '데이터 마트',
    },
  ];

  // 어드민인 경우 접근 관리 메뉴 추가
  if (user?.role === 'admin') {
    menuItems.push(
      // 구분선: 도구 그룹 끝
      {
        type: 'divider' as const,
      },
      {
        key: '/user-management',
        icon: <UserOutlined />,
        label: '접근 관리',
      }
    );
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    // 권한 체크
    if (key === '/reports' && !hasPermission('access_reports')) {
      message.warning('보고서 페이지 접근 권한이 없습니다.');
      return;
    }
    if (key === '/report-collection' && !hasPermission('access_report_collection')) {
      message.warning('보고서 수집 페이지 접근 권한이 없습니다.');
      return;
    }
    if (key === '/labeling' && !hasPermission('access_labeling')) {
      message.warning('라벨링 페이지 접근 권한이 없습니다.');
      return;
    }
    if (key === '/api-docs' && !hasPermission('access_api_docs')) {
      message.warning('API 문서 페이지 접근 권한이 없습니다.');
      return;
    }
    if (key === '/profile-management' && !hasPermission('access_profile_management')) {
      message.warning('프로필 관리 페이지 접근 권한이 없습니다.');
      return;
    }
    if (key === '/recommendation-api-schema' && !hasPermission('access_recommendation_api_schema')) {
      message.warning('추천 API 스키마 페이지 접근 권한이 없습니다.');
      return;
    }
    history.push(key);
  };

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  // 로그인 페이지는 인증 확인 없이 바로 표시
  if (location.pathname === '/login') {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Redirect to="/login" />
      </Switch>
    );
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="logo" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <img src="/icon.png" alt="The Substrata" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontWeight: 600, fontSize: '16px', color: '#001529' }}>The Substrata</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, borderRight: 0, overflowY: 'auto' }}
        />
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>{user?.username}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user?.role === 'admin' ? '어드민' : '직원'}
            </Text>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ padding: 0, width: '100%', textAlign: 'left' }}
            >
              로그아웃
            </Button>
          </Space>
        </div>
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
          <Switch>
            <PrivateRoute exact path="/" component={Dashboard} />
            <PrivateRoute path="/investors" component={Investors} />
            <PrivateRoute path="/articles" component={Articles} />
            <PrivateRoute path="/news-collection" component={NewsCollection} />
            <Route 
              path="/report-collection" 
              render={() => {
                if (!hasPermission('access_report_collection')) {
                  return <NotFound />;
                }
                return <ReportCollection />;
              }} 
            />
            <PrivateRoute path="/investments" component={Investments} />
            <PrivateRoute path="/funds" component={Funds} />
            <PrivateRoute path="/fund-articles" component={FundArticles} />
            <PrivateRoute path="/other-activities" component={OtherActivities} />
            <PrivateRoute exact path="/reports" component={Reports} />
            <PrivateRoute path="/reports/view/:investorId" component={ReportView} />
            <PrivateRoute path="/labeling" component={Labeling} />
            <Route 
              path="/api-docs" 
              render={() => {
                if (!hasPermission('access_api_docs')) {
                  return <NotFound />;
                }
                return <APIDocs />;
              }} 
            />
            <Route 
              path="/recommendation-api-schema" 
              render={() => {
                if (!hasPermission('access_recommendation_api_schema')) {
                  return <NotFound />;
                }
                return <RecommendationAPISchema />;
              }} 
            />
            <PrivateRoute path="/data-mart" component={DataMart} />
            <PrivateRoute path="/blacklist" component={Blacklist} />
            <PrivateRoute path="/crawling-failed-domains" component={CrawlingFailedDomains} />
            <Route 
              path="/profile-management" 
              render={() => {
                if (!hasPermission('access_profile_management')) {
                  return <NotFound />;
                }
                return <ProfileManagement />;
              }} 
            />
            <Route path="/user-management" render={() => user.role === 'admin' ? <UserManagement /> : <NotFound />} />
            <Route component={NotFound} />
          </Switch>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
