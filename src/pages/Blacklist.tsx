import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, message, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { blacklistAPI } from '../services/api';

const { TextArea } = Input;

interface BlacklistItem {
  id: number;
  domain: string;
  reason: string | null;
  article_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const Blacklist: React.FC = () => {
  const [blacklists, setBlacklists] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [articleCountModalVisible, setArticleCountModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [articleCountData, setArticleCountData] = useState<any>(null);
  const [checkingCount, setCheckingCount] = useState(false);

  useEffect(() => {
    fetchBlacklists();
  }, []);

  const fetchBlacklists = async () => {
    try {
      setLoading(true);
      const response = await blacklistAPI.getBlacklists();
      setBlacklists(response.data || []);
    } catch (error: any) {
      console.error('블랙리스트 조회 실패:', error);
      message.error('블랙리스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setAddModalVisible(true);
  };

  const handleCheckArticleCount = async () => {
    try {
      const values = await form.validateFields(['domain']);
      const domain = values.domain;
      
      setCheckingCount(true);
      const response = await blacklistAPI.getArticleCount(domain);
      setArticleCountData(response.data);
      setArticleCountModalVisible(true);
    } catch (error: any) {
      if (error.errorFields) {
        // 폼 검증 오류
        return;
      }
      console.error('기사 개수 조회 실패:', error);
      message.error('기사 개수를 조회하는데 실패했습니다.');
    } finally {
      setCheckingCount(false);
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const values = await form.validateFields();
      const domain = values.domain;
      const reason = values.reason;
      
      // 블랙리스트 추가 및 기사 삭제
      await blacklistAPI.createBlacklist(domain, reason, 'admin', true);
      message.success('블랙리스트가 추가되었고 해당 사이트의 기사가 삭제되었습니다.');
      setAddModalVisible(false);
      setArticleCountModalVisible(false);
      form.resetFields();
      fetchBlacklists();
    } catch (error: any) {
      console.error('블랙리스트 추가 실패:', error);
      message.error(error?.response?.data?.detail || '블랙리스트 추가에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await blacklistAPI.deleteBlacklist(id);
      message.success('블랙리스트가 삭제되었습니다.');
      fetchBlacklists();
    } catch (error: any) {
      console.error('블랙리스트 삭제 실패:', error);
      message.error('블랙리스트 삭제에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '도메인',
      dataIndex: 'domain',
      key: 'domain',
      render: (text: string) => <Tag color="red">{text}</Tag>,
    },
    {
      title: '이유',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string | null) => text || '-',
    },
    {
      title: '삭제된 기사 수',
      dataIndex: 'article_count',
      key: 'article_count',
      width: 120,
      render: (count: number) => <Tag color="orange">{count}개</Tag>,
    },
    {
      title: '등록자',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 100,
      render: (text: string | null) => text || '-',
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      render: (_: any, record: BlacklistItem) => (
        <Popconfirm
          title="블랙리스트를 삭제하시겠습니까?"
          onConfirm={() => handleDelete(record.id)}
          okText="삭제"
          cancelText="취소"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            삭제
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="블랙리스트 관리"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBlacklists}
              loading={loading}
            >
              새로고침
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              블랙리스트 추가
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={blacklists}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 블랙리스트 추가 모달 */}
      <Modal
        title="블랙리스트 추가"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setArticleCountModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="domain"
            label="뉴스 사이트 주소"
            rules={[{ required: true, message: '뉴스 사이트 주소를 입력해주세요.' }]}
          >
            <Input placeholder="예: example.com 또는 https://example.com" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="블랙리스트 등록 이유"
          >
            <TextArea rows={4} placeholder="블랙리스트 등록 이유를 입력해주세요." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="default"
                onClick={handleCheckArticleCount}
                loading={checkingCount}
              >
                기사 개수 확인
              </Button>
              <Button onClick={() => {
                setAddModalVisible(false);
                form.resetFields();
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 기사 개수 확인 모달 */}
      <Modal
        title="기사 개수 확인"
        open={articleCountModalVisible}
        onOk={handleConfirmAdd}
        onCancel={() => {
          setArticleCountModalVisible(false);
        }}
        okText="삭제하고 등록"
        cancelText="취소"
        width={800}
      >
        {articleCountData && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fff7e6', borderRadius: 4 }}>
              <strong>도메인:</strong> {articleCountData.domain}
              <br />
              <strong>기사 개수:</strong> <Tag color="red" style={{ fontSize: '16px', padding: '4px 8px' }}>
                {articleCountData.article_count}개
              </Tag>
            </div>
            {articleCountData.article_count > 0 && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>주의:</strong> 등록 시 해당 도메인의 모든 기사({articleCountData.article_count}개)가 삭제됩니다.
                </div>
                {articleCountData.articles && articleCountData.articles.length > 0 && (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <strong>기사 목록 (최대 100개):</strong>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      {articleCountData.articles.map((article: any) => (
                        <li key={article.id} style={{ marginBottom: 8 }}>
                          <div>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                              {article.title}
                            </a>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {article.url}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {articleCountData.article_count === 0 && (
              <div style={{ padding: 16, backgroundColor: '#f6ffed', borderRadius: 4 }}>
                해당 도메인의 기사가 없습니다. 블랙리스트에 등록만 됩니다.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Blacklist;

