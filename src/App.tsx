import React from 'react';
import { BrowserRouter as Router, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  FundOutlined,
  TagOutlined
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import Articles from './pages/Articles';
import Investments from './pages/Investments';
import Funds from './pages/Funds';
import Labeling from './pages/Labeling';

const { Header, Sider, Content } = Layout;

const AppContent: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

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
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    history.push(key);
  };

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
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h1 style={{ margin: 0, color: '#001529' }}>투자사 기반 스타트업 뉴스 분석 시스템</h1>
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/investors" component={Investors} />
            <Route path="/articles" component={Articles} />
            <Route path="/investments" component={Investments} />
            <Route path="/funds" component={Funds} />
            <Route path="/labeling" component={Labeling} />
          </Switch>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
