import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Space, Tag, Popconfirm } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { crawlingFailedDomainsAPI } from '../services/api';

interface CrawlingFailedDomainItem {
  id: number;
  domain: string;
  article_id: number | null;
  article_url: string | null;
  created_at: string;
}

const CrawlingFailedDomains: React.FC = () => {
  const [domains, setDomains] = useState<CrawlingFailedDomainItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await crawlingFailedDomainsAPI.getCrawlingFailedDomains();
      setDomains(response.data || []);
    } catch (error: any) {
      console.error('크롤링 실패 예상 주소 조회 실패:', error);
      message.error('크롤링 실패 예상 주소를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await crawlingFailedDomainsAPI.deleteCrawlingFailedDomain(id);
      message.success('크롤링 실패 예상 주소가 삭제되었습니다.');
      fetchDomains();
    } catch (error: any) {
      console.error('크롤링 실패 예상 주소 삭제 실패:', error);
      message.error('크롤링 실패 예상 주소 삭제에 실패했습니다.');
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
      render: (text: string) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: '기사 URL',
      dataIndex: 'article_url',
      key: 'article_url',
      render: (url: string | null) => {
        if (!url) return '-';
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ maxWidth: '400px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}
          </a>
        );
      },
    },
    {
      title: '기사 ID',
      dataIndex: 'article_id',
      key: 'article_id',
      width: 100,
      render: (id: number | null) => id || '-',
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
      render: (_: any, record: CrawlingFailedDomainItem) => (
        <Popconfirm
          title="크롤링 실패 예상 주소를 삭제하시겠습니까?"
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
        title="크롤링 실패 예상 주소 (분석용)"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDomains}
            loading={loading}
          >
            새로고침
          </Button>
        }
      >
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4 }}>
          <strong>참고:</strong> 이 목록은 분석용이며, 뉴스 수집에 영향을 주지 않습니다. 기사 본문을 수동 입력한 경우 해당 기사의 도메인이 자동으로 추가됩니다.
        </div>
        <Table
          columns={columns}
          dataSource={domains}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>
    </div>
  );
};

export default CrawlingFailedDomains;

