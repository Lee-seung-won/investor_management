import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Typography,
  Tag,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { dataMartAPI } from '../services/api';
import DataMartCollectionProgress from '../components/DataMartCollectionProgress';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DataMartInfo {
  id: number;
  name: string;
  data_character: string;
  calculation_method: string;
  usage: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface InvestorDataMart {
  investor_id: number;
  investor_name: string;
  investment_momentum: number | null;
  avg_investment_count: number | null;
  fresh_fund_count: number | null;
  avg_ticket_size: number | null;
  initial_investment_concentration: number | null;
  recent_activity: number | null;
  collection_date: string | null;
}

const DataMart: React.FC = () => {
  const [infoList, setInfoList] = useState<DataMartInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInfo, setEditingInfo] = useState<DataMartInfo | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [searchResults, setSearchResults] = useState<InvestorDataMart[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 데이터 마트 정보 목록 조회
  const fetchInfoList = async () => {
    setLoading(true);
    try {
      const response = await dataMartAPI.getInfoList();
      setInfoList(response.data);
    } catch (error) {
      message.error('데이터 마트 정보 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfoList();
  }, []);

  // 모달 열기 (생성)
  const handleCreate = () => {
    setEditingInfo(null);
    form.resetFields();
    form.setFieldsValue({
      order_index: 0,
    });
    setModalVisible(true);
  };

  // 모달 열기 (수정)
  const handleEdit = (info: DataMartInfo) => {
    setEditingInfo(info);
    form.setFieldsValue({
      name: info.name,
      data_character: info.data_character,
      calculation_method: info.calculation_method,
      usage: info.usage,
      order_index: info.order_index,
    });
    setModalVisible(true);
  };

  // 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingInfo) {
        // 수정
        await dataMartAPI.updateInfo(editingInfo.id, values);
        message.success('데이터 마트 정보가 수정되었습니다.');
      } else {
        // 생성
        await dataMartAPI.createInfo(values);
        message.success('데이터 마트 정보가 생성되었습니다.');
      }
      
      setModalVisible(false);
      fetchInfoList();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('저장에 실패했습니다.');
      }
    }
  };

  // 삭제
  const handleDelete = async (info: DataMartInfo) => {
    Modal.confirm({
      title: '삭제 확인',
      content: `"${info.name}" 데이터 마트 정보를 삭제하시겠습니까?`,
      onOk: async () => {
        try {
          await dataMartAPI.deleteInfo(info.id);
          message.success('데이터 마트 정보가 삭제되었습니다.');
          fetchInfoList();
        } catch (error: any) {
          if (error.response?.data?.detail) {
            message.error(error.response.data.detail);
          } else {
            message.error('삭제에 실패했습니다.');
          }
        }
      },
    });
  };

  // 투자사 검색
  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    const keyword = values.investor_name?.trim();
    
    if (!keyword) {
      message.warning('투자사명을 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setSearchKeyword(keyword);
    try {
      const response = await dataMartAPI.search(keyword);
      setSearchResults(response.data.investors || []);
      
      if (response.data.investors.length === 0) {
        message.info('검색 결과가 없습니다.');
      }
    } catch (error) {
      message.error('검색에 실패했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 데이터 마트 정보 테이블 컬럼
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ title: string; content: string } | null>(null);

  const showDetail = (title: string, content: string | null) => {
    if (!content) {
      message.info('내용이 없습니다.');
      return;
    }
    setSelectedDetail({ title, content });
    setDetailModalVisible(true);
  };

  const showNameDetail = (record: DataMartInfo) => {
    const detailContent = record.usage || '용도 정보가 없습니다.';
    setSelectedDetail({ title: record.name, content: detailContent });
    setDetailModalVisible(true);
  };

  const infoColumns = [
    {
      title: '순서',
      dataIndex: 'order_index',
      key: 'order_index',
      width: 80,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: DataMartInfo) => (
        <Button
          type="link"
          onClick={() => showNameDetail(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '데이터 성격',
      dataIndex: 'data_character',
      key: 'data_character',
      width: 120,
      render: (text: string) => {
        const colorMap: { [key: string]: string } = {
          '활동성': 'blue',
          '자금력': 'green',
          '성격': 'purple',
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: '계산 방식',
      dataIndex: 'calculation_method',
      key: 'calculation_method',
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: DataMartInfo) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  // 검색 결과 테이블 컬럼
  const searchColumns = [
    {
      title: '투자 모멘텀',
      dataIndex: 'investment_momentum',
      key: 'investment_momentum',
      render: (value: number | null) => value !== null ? value.toFixed(2) : '-',
    },
    {
      title: '연평균 투자건수',
      dataIndex: 'avg_investment_count',
      key: 'avg_investment_count',
      render: (value: number | null) => value !== null ? value.toFixed(2) : '-',
    },
    {
      title: '싱싱한 펀드 수',
      dataIndex: 'fresh_fund_count',
      key: 'fresh_fund_count',
      render: (value: number | null) => value !== null ? value : '-',
    },
    {
      title: '평균 티켓 사이즈',
      dataIndex: 'avg_ticket_size',
      key: 'avg_ticket_size',
      render: (value: number | null) => value !== null ? value.toLocaleString('ko-KR') : '-',
    },
    {
      title: '초기 투자 집중도',
      dataIndex: 'initial_investment_concentration',
      key: 'initial_investment_concentration',
      render: (value: number | null) => value !== null ? (value * 100).toFixed(2) + '%' : '-',
    },
    {
      title: '최근 활동성',
      dataIndex: 'recent_activity',
      key: 'recent_activity',
      render: (value: number | null) => value !== null ? value : '-',
    },
    {
      title: '수집 날짜',
      dataIndex: 'collection_date',
      key: 'collection_date',
      render: (text: string | null) => text ? new Date(text).toLocaleString('ko-KR') : '-',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>데이터 마트</Title>

      {/* 데이터 마트 정보 관리 */}
      <Card
        title="데이터 마트 정보"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            추가
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={infoColumns}
          dataSource={infoList}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      <Divider />

      {/* 데이터 마트 수집기 */}
      <Card style={{ marginBottom: '24px' }}>
        <DataMartCollectionProgress />
      </Card>

      <Divider />

      {/* 투자사 검색 */}
      <Card title="투자사 데이터 마트 검색" style={{ marginBottom: '24px' }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item
            name="investor_name"
            rules={[{ required: true, message: '투자사명을 입력해주세요.' }]}
            style={{ flex: 1, maxWidth: '400px' }}
          >
            <Input
              placeholder="투자사명을 입력하세요"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={searchLoading}>
              검색
            </Button>
          </Form.Item>
        </Form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            {searchResults.map((investor) => (
              <Card
                key={investor.investor_id}
                title={
                  <Space>
                    <Text strong>{investor.investor_name}</Text>
                    <Tag>ID: {investor.investor_id}</Tag>
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Table
                  columns={searchColumns}
                  dataSource={[investor]}
                  rowKey="investor_id"
                  pagination={false}
                  size="small"
                />
              </Card>
            ))}
          </div>
        )}

        {searchKeyword && searchResults.length === 0 && !searchLoading && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Text type="secondary">검색 결과가 없습니다.</Text>
          </div>
        )}
      </Card>

      {/* 상세 보기 모달 */}
      <Modal
        title={selectedDetail?.title}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedDetail(null);
          }}>
            닫기
          </Button>
        ]}
        width={700}
      >
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          {selectedDetail?.content}
        </div>
      </Modal>

      {/* 생성/수정 모달 */}
      <Modal
        title={editingInfo ? '데이터 마트 정보 수정' : '데이터 마트 정보 생성'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="이름"
            rules={[{ required: true, message: '이름을 입력해주세요.' }]}
          >
            <Input placeholder="예: 투자 모멘텀" />
          </Form.Item>

          <Form.Item
            name="data_character"
            label="데이터 성격"
            rules={[{ required: true, message: '데이터 성격을 선택해주세요.' }]}
          >
            <Select placeholder="데이터 성격을 선택하세요">
              <Option value="활동성">활동성</Option>
              <Option value="자금력">자금력</Option>
              <Option value="성격">성격</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="calculation_method"
            label="계산 방식"
            rules={[{ required: true, message: '계산 방식을 입력해주세요.' }]}
          >
            <TextArea
              rows={4}
              placeholder="예: 올해 건수 / 연평균 건수"
            />
          </Form.Item>

          <Form.Item
            name="usage"
            label="용도"
          >
            <TextArea
              rows={3}
              placeholder="용도를 입력하세요 (선택사항)"
            />
          </Form.Item>

          <Form.Item
            name="order_index"
            label="순서"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataMart;
