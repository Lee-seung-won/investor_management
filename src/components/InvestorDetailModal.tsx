import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Card, Tag, Descriptions, Table, Button, Spin, message, Typography, Input, Switch, Form, Select } from 'antd';
import { GlobalOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { investorsAPI } from '../services/api.ts';
import { Investor } from '../types/index';

const { TabPane } = Tabs;
const { Text, Paragraph } = Typography;

interface InvestorDetailModalProps {
  visible: boolean;
  investorId: number | null;
  onClose: () => void;
}

const InvestorDetailModal: React.FC<InvestorDetailModalProps> = ({
  visible,
  investorId,
  onClose
}) => {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchInvestorDetail = useCallback(async () => {
    if (!investorId) return;
    
    try {
      setLoading(true);
      const response = await investorsAPI.getInvestor(investorId);
      setInvestor(response.data);
      form.setFieldsValue({
        website: response.data.website,
        contact: response.data.contact,
        is_active: response.data.is_active
      });
    } catch (error) {
      message.error('투자사 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [investorId, form]);

  useEffect(() => {
    if (visible && investorId) {
      fetchInvestorDetail();
    }
  }, [visible, investorId, fetchInvestorDetail]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      website: investor?.website,
      contact: investor?.contact,
      email: investor?.email,
      is_active: investor?.is_active,
      sectors: investor?.sectors || [],
      description: investor?.description
    });
  };

  const handleSave = async () => {
    if (!investorId) return;
    
    try {
      const values = await form.validateFields();
      console.log('Sending update data:', values); // 디버깅용
      const response = await investorsAPI.updateInvestor(investorId, values);
      setInvestor(response.data);
      setIsEditing(false);
      message.success('투자사 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Update error:', error); // 디버깅용
      message.error('투자사 정보 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.setFieldsValue({
      website: investor?.website,
      contact: investor?.contact,
      email: investor?.email,
      is_active: investor?.is_active,
      sectors: investor?.sectors || [],
      description: investor?.description
    });
  };


  if (!investor) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: 18 }}>{investor.name}</Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>{investor.type}</Tag>
          </div>
          <div>
            {!isEditing ? (
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                수정
              </Button>
            ) : (
              <div>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                  style={{ marginRight: 8 }}
                >
                  저장
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancel}>
                  취소
                </Button>
              </div>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="기본정보" key="info">
              <Card>
                <Descriptions column={2} bordered>
                <Descriptions.Item label="투자사명" span={2} contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  <Text strong style={{ display: 'block', lineHeight: '1.5' }}>{investor.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="유형" contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  <Text style={{ display: 'block', lineHeight: '1.5' }}>{investor.type}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="상태" contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  {isEditing ? (
                    <Form.Item name="is_active" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch 
                        checkedChildren="활성" 
                        unCheckedChildren="비활성"
                      />
                    </Form.Item>
                  ) : (
                    <Tag color={investor.is_active ? 'green' : 'red'}>
                      {investor.is_active ? '활성' : '비활성'}
                    </Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="웹사이트" span={2} contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  {isEditing ? (
                    <Form.Item name="website" style={{ margin: 0 }}>
                      <Input placeholder="웹사이트 URL을 입력하세요" />
                    </Form.Item>
                  ) : (
                    investor.website ? (
                      <a href={investor.website} target="_blank" rel="noopener noreferrer" style={{ display: 'block', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <GlobalOutlined /> {investor.website}
                      </a>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="연락처" span={2} contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  {isEditing ? (
                    <Form.Item name="contact" style={{ margin: 0 }}>
                      <Input placeholder="연락처를 입력하세요" />
                    </Form.Item>
                  ) : (
                    investor.contact ? (
                      <Text copyable style={{ display: 'block', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{investor.contact}</Text>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                      )}
                </Descriptions.Item>
                <Descriptions.Item label="이메일" span={2} contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  {isEditing ? (
                    <Form.Item name="email" style={{ margin: 0 }}>
                      <Input placeholder="이메일을 입력하세요" type="email" />
                    </Form.Item>
                  ) : (
                    investor.email ? (
                      <Text copyable style={{ display: 'block', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{investor.email}</Text>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="전문분야" span={2} contentStyle={{ maxHeight: '50px', overflowY: 'auto' }}>
                  {isEditing ? (
                    <Form.Item name="sectors" style={{ margin: 0 }}>
                      <Select
                        mode="tags"
                        placeholder="전문분야를 입력하세요"
                        style={{ width: '100%' }}
                        tokenSeparators={[',']}
                      />
                    </Form.Item>
                  ) : (
                    investor.sectors && investor.sectors.length > 0 ? (
                      <div style={{ maxHeight: '40px', overflowY: 'auto' }}>
                        {investor.sectors.map((sector, index) => (
                          <Tag key={index} color="blue" style={{ marginBottom: 2, marginRight: 4 }}>
                            {sector}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="설명" span={2} contentStyle={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {isEditing ? (
                    <Form.Item name="description" style={{ margin: 0 }}>
                      <Input.TextArea 
                        rows={4} 
                        placeholder="투자사 설명을 입력하세요"
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                  ) : (
                    investor.description ? (
                      <Paragraph style={{ margin: 0, wordBreak: 'break-word' }}>{investor.description}</Paragraph>
                    ) : (
                      <Text type="secondary">정보 없음</Text>
                    )
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="프로필 텍스트" span={2} contentStyle={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {investor.profile_text ? (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px',
                      maxHeight: '280px',
                      overflowY: 'auto'
                    }}>
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {investor.profile_text}
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                        (AC Processor가 생성한 임베딩용 프로필 텍스트)
                      </Text>
                    </div>
                  ) : (
                    <Text type="secondary">프로필 텍스트가 생성되지 않았습니다.</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="등록일" contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  <Text style={{ display: 'block', lineHeight: '1.5' }}>{new Date(investor.created_at).toLocaleDateString('ko-KR')}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="수정일" contentStyle={{ maxHeight: '32px', overflow: 'hidden' }}>
                  <Text style={{ display: 'block', lineHeight: '1.5' }}>{new Date(investor.updated_at).toLocaleDateString('ko-KR')}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
        </Tabs>
        </Form>
      </Spin>
    </Modal>
  );
};

export default InvestorDetailModal;
