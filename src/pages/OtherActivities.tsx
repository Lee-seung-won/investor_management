import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Input, Tag, Space, Button, message, Row, Col, List, Badge, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DeleteOutlined } from '@ant-design/icons';
import { investorsAPI, otherActivitiesAPI } from '../services/api';

interface InvestorWithCount {
  investor_id: number;
  investor_name: string;
  other_activity_count: number;
}

interface OtherActivity {
  id: number;
  ac_name: string;
  event_type: string;
  related_company?: string;
  summary: string;
  date?: string;
  article?: {
    id: number;
    title: string;
    url: string;
    published_at?: string;
  };
}

const OtherActivities: React.FC = () => {
  const [investors, setInvestors] = useState<InvestorWithCount[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [activities, setActivities] = useState<OtherActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });
  const [investorSearchText, setInvestorSearchText] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<OtherActivity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // 활성화된 엑셀러레이터 목록 및 기타활동 개수 가져오기
  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await investorsAPI.getInvestorOtherActivityCounts({ is_active: true });
      if (response.data && response.data.investors) {
        setInvestors(response.data.investors);
        // 첫 번째 투자사를 자동 선택 (아직 선택된 투자사가 없는 경우만)
        if (response.data.investors.length > 0 && selectedInvestorId === null) {
          setSelectedInvestorId(response.data.investors[0].investor_id);
        }
      }
    } catch (error: any) {
      console.error('투자사 목록 로딩 오류:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || '알 수 없는 오류';
      message.error(`투자사 목록을 불러오는데 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [selectedInvestorId]);

  // 선택한 투자사의 기타활동 목록 가져오기
  const fetchActivities = useCallback(async () => {
    if (!selectedInvestorId) {
      setActivities([]);
      setTotal(0);
      return;
    }

    try {
      setActivitiesLoading(true);
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      };

      const response = await investorsAPI.getInvestorOtherActivities(selectedInvestorId, params);
      setActivities(response.data.other_activities || []);
      setTotal(response.data.total_count || 0);
    } catch (error) {
      console.error('기타활동 정보 로딩 오류:', error);
      message.error('기타활동 정보를 불러오는데 실패했습니다.');
    } finally {
      setActivitiesLoading(false);
    }
  }, [selectedInvestorId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleInvestorClick = (investorId: number) => {
    setSelectedInvestorId(investorId);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const showActivityDetail = (activity: OtherActivity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const handleDelete = async (activity: OtherActivity) => {
    Modal.confirm({
      title: '활동 이력 삭제',
      content: `이 활동 이력을 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await otherActivitiesAPI.deleteOtherActivity(activity.id);
          message.success('활동 이력이 삭제되었습니다.');
          setModalVisible(false);
          fetchActivities();
          fetchInvestors(); // 투자사 목록도 새로고침 (개수 업데이트)
        } catch (error) {
          console.error('활동 이력 삭제 오류:', error);
          message.error('활동 이력 삭제에 실패했습니다.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number, record: OtherActivity) => (
        <Button
          type="link"
          onClick={() => showActivityDetail(record)}
          style={{ padding: 0 }}
        >
          {id}
        </Button>
      ),
    },
    {
      title: '활동 유형',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 150,
      render: (text: string) => text ? <Tag color="purple">{text}</Tag> : '-',
    },
    {
      title: '요약',
      dataIndex: 'summary',
      key: 'summary',
      render: (text: string) => (
        <div style={{ 
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
          wordWrap: 'break-word'
        }}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: '활동 날짜',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString('ko-KR') : '-',
      sorter: (a: OtherActivity, b: OtherActivity) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      },
      defaultSortOrder: 'descend' as const,
    },
  ];

  const selectedInvestor = investors.find(inv => inv.investor_id === selectedInvestorId);

  // 엑셀러레이터 목록 필터링
  const filteredInvestors = investors.filter(investor =>
    investor.investor_name.toLowerCase().includes(investorSearchText.toLowerCase())
  );

  return (
    <div>
      <Row gutter={16} style={{ height: 'calc(100vh - 100px)' }}>
        {/* 왼쪽: 엑셀러레이터 목록 */}
        {sidebarVisible && (
          <Col span={6} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card 
            title="엑셀러레이터 목록" 
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                size="small"
                onClick={fetchInvestors}
                loading={loading}
              />
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            bodyStyle={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '16px', 
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            <div style={{ marginBottom: '12px', flexShrink: 0 }}>
              <Input
                placeholder="엑셀러레이터 검색"
                prefix={<SearchOutlined />}
                value={investorSearchText}
                onChange={(e) => setInvestorSearchText(e.target.value)}
                allowClear
                size="small"
              />
            </div>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%'
            }}>
              <List
                loading={loading}
                dataSource={filteredInvestors}
                style={{ height: '100%' }}
                renderItem={(investor) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedInvestorId === investor.investor_id ? '#e6f7ff' : 'transparent',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      border: selectedInvestorId === investor.investor_id ? '1px solid #1890ff' : '1px solid #f0f0f0'
                    }}
                    onClick={() => handleInvestorClick(investor.investor_id)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: selectedInvestorId === investor.investor_id ? 'bold' : 'normal' }}>
                            {investor.investor_name}
                          </span>
                          <Badge 
                            count={investor.other_activity_count} 
                            style={{ backgroundColor: investor.other_activity_count > 0 ? '#722ed1' : '#d9d9d9' }}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
          </Col>
        )}

        {/* 오른쪽: 기타활동 목록 */}
        <Col span={sidebarVisible ? 18 : 24}>
          <Card 
            title={selectedInvestor ? `${selectedInvestor.investor_name}의 활동 이력` : '활동 이력 목록'}
            extra={
              <Space>
                <Button 
                  icon={sidebarVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                >
                  {sidebarVisible ? '목록 숨기기' : '목록 보이기'}
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchActivities}
                  loading={activitiesLoading}
                >
                  새로고침
                </Button>
              </Space>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto' }}
          >
            {selectedInvestorId ? (
              <Table
                columns={columns}
                dataSource={activities}
                rowKey="id"
                loading={activitiesLoading}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} / 총 ${total}개`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                onChange={handleTableChange}
                scroll={{ x: 1000, y: 'calc(100vh - 300px)' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
                왼쪽에서 엑셀러레이터를 선택하세요
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="활동 이력 상세"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            닫기
          </Button>,
          <Button 
            key="delete" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => selectedActivity && handleDelete(selectedActivity)}
          >
            삭제
          </Button>,
        ]}
        width={800}
      >
        {selectedActivity && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>활동 유형:</strong> {selectedActivity.event_type ? <Tag color="purple">{selectedActivity.event_type}</Tag> : '-'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>요약:</strong> {selectedActivity.summary || '-'}
            </div>
            {selectedActivity.related_company && (
              <div style={{ marginBottom: 16 }}>
                <strong>협력 기업:</strong> {selectedActivity.related_company}
              </div>
            )}
            {selectedActivity.date && (
              <div style={{ marginBottom: 16 }}>
                <strong>활동 날짜:</strong> {new Date(selectedActivity.date).toLocaleDateString('ko-KR')}
              </div>
            )}
            
            {/* 출처 기사 정보 섹션 */}
            {selectedActivity.article && (
              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12, color: '#1890ff' }}>📰 출처 기사 정보</h4>
                <div style={{ marginBottom: 8 }}>
                  <strong>기사 제목:</strong> 
                  <div style={{ marginTop: 4, fontSize: '14px', color: '#666' }}>
                    {selectedActivity.article.title}
                  </div>
                </div>
                {selectedActivity.article.published_at && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>발행일:</strong> {new Date(selectedActivity.article.published_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
                {selectedActivity.article.url && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>URL:</strong> 
                    <a href={selectedActivity.article.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                      기사 링크
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OtherActivities;

