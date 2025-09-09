import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Tag, Typography, Button, Space, Spin, message } from 'antd';
import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

const { Text } = Typography;

interface ActivityLog {
  id: number;
  user_name: string;
  action: string;
  details: any;
  created_at: string;
}

interface ActivityLogModalProps {
  visible: boolean;
  onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await authAPI.getActivityLogs(undefined, 100); // 최대 100개 로그
      const allLogs = response.data.logs || [];
      setLogs(allLogs);
      setTotal(allLogs.length);
    } catch (error) {
      message.error('활동 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLogs(1);
    }
  }, [visible]);


  const renderLogItem = (log: ActivityLog) => (
    <List.Item
      style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <List.Item.Meta
        avatar={
          <Avatar 
            style={{ 
              backgroundColor: '#1890ff',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {log.user_name?.charAt(0) || 'U'}
          </Avatar>
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Text strong style={{ color: '#1890ff' }}>{log.user_name}</Text>
            <Tag 
              color={
                log.action === '로그인' ? 'green' :
                log.action === '사용자생성' ? 'blue' :
                log.action === '뉴스수집시작' ? 'orange' :
                log.action === '뉴스수집중단' ? 'red' :
                log.action === '뉴스수집재개' ? 'cyan' :
                log.action === '투자정보등록' ? 'purple' :
                log.action === '펀드정보등록' ? 'magenta' :
                log.action === '라벨링' ? 'gold' : 'default'
              }
              size="small"
            >
              {log.action}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {(() => {
                const koreanDate = new Date(log.created_at);
                koreanDate.setHours(koreanDate.getHours() + 9);
                return koreanDate.toLocaleString('ko-KR');
              })()}
            </Text>
          </div>
        }
        description={
          <div style={{ color: '#666', fontSize: '14px' }}>
            {(() => {
              const details = log.details || {};
              if (log.action === '투자정보등록') {
                return `"${details.startup_name || '스타트업'}" 기사(ID: ${details.article_id || 'N/A'})에서 투자정보를 입력하였습니다.`;
              } else if (log.action === '펀드정보등록') {
                return `"${details.fund_name || '펀드'}" 기사(ID: ${details.article_id || 'N/A'})에서 펀드정보를 입력하였습니다.`;
              } else if (log.action === '라벨링') {
                return `기사(ID: ${details.article_id || 'N/A'})에서 ${details.token_count || 0}개의 토큰을 라벨링하였습니다.`;
              } else if (log.action === '뉴스수집시작') {
                return `뉴스 수집을 시작하였습니다. (제한: ${details.limit || 'N/A'}개)`;
              } else if (log.action === '뉴스수집중단') {
                return '뉴스 수집을 중단하였습니다.';
              } else if (log.action === '뉴스수집재개') {
                return '뉴스 수집을 재개하였습니다.';
              } else if (log.action === '사용자생성') {
                return `새로운 사용자 "${details.user_name || 'N/A'}"가 생성되었습니다.`;
              } else if (log.action === '로그인') {
                return '시스템에 로그인하였습니다.';
              } else {
                return '시스템 활동을 수행하였습니다.';
              }
            })()}
          </div>
        }
      />
    </List.Item>
  );

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>전체 활동 로그 ({total}개)</span>
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={() => fetchLogs(1)}
            loading={loading}
          >
            새로고침
          </Button>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            활동 로그가 없습니다.
          </div>
        ) : (
          <>
            <List
              dataSource={logs}
              renderItem={renderLogItem}
              split={false}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default ActivityLogModal;
