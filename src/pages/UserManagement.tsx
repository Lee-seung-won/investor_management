import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Switch, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { userManagementAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  permissions?: {
    access_reports: boolean;
    view_report_detail: boolean;
    collect_fund_news: boolean;
    refresh_all_funds: boolean;
    access_labeling: boolean;
    access_api_docs: boolean;
    access_profile_management: boolean;
  };
  created_at: string | null;
  last_login: string | null;
}

const PERMISSION_LABELS: { [key: string]: string } = {
  access_reports: '보고서 페이지 접근',
  view_report_detail: '보고서 상세보기',
  collect_fund_news: '펀드뉴스수집',
  refresh_all_funds: '전체펀드정보 갱신',
  access_labeling: '라벨링 페이지 접근',
  access_api_docs: 'API 문서 페이지 접근',
  access_profile_management: '프로필 관리 페이지 접근',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const [createForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [permissionsForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userManagementAPI.getUsers();
      setUsers(response.data);
    } catch (error: any) {
      message.error('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (values: { username: string; password: string; role: string }) => {
    try {
      await userManagementAPI.createUser(values);
      message.success('사용자가 생성되었습니다.');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '사용자 생성에 실패했습니다.');
    }
  };

  const handleUpdatePassword = async (values: { new_password: string }) => {
    if (!selectedUser) return;
    try {
      await userManagementAPI.updatePassword(selectedUser.id, values.new_password);
      message.success('비밀번호가 변경되었습니다.');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      setSelectedUser(null);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleToggleStatus = async (user: User, checked: boolean) => {
    try {
      await userManagementAPI.toggleUserStatus(user.id, checked);
      message.success(`사용자가 ${checked ? '활성화' : '비활성화'}되었습니다.`);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '상태 변경에 실패했습니다.');
    }
  };

  const handleUpdatePermissions = async (values: any) => {
    if (!selectedUser) return;
    try {
      const permissions: any = {};
      Object.keys(PERMISSION_LABELS).forEach(key => {
        permissions[key] = values[key] || false;
      });
      await userManagementAPI.updatePermissions(selectedUser.id, permissions);
      message.success('권한이 업데이트되었습니다.');
      setPermissionsModalVisible(false);
      permissionsForm.resetFields();
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '권한 업데이트에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '권한',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '어드민' : '직원'}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: User) => {
        // 현재 사용자 정보를 가져와서 비교
        const isCurrentUser = currentUser?.username === record.username;
        return (
          <Switch
            checked={isActive}
            onChange={(checked) => handleToggleStatus(record, checked)}
            disabled={isCurrentUser && !isActive}
          />
        );
      },
    },
    {
      title: '생성일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | null) => date ? new Date(date).toLocaleString('ko-KR') : '-',
    },
    {
      title: '마지막 로그인',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date: string | null) => date ? new Date(date).toLocaleString('ko-KR') : '-',
    },
    {
      title: '작업',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedUser(record);
              setPasswordModalVisible(true);
            }}
          >
            비밀번호 변경
          </Button>
          {record.role === 'employee' && (
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => {
                setSelectedUser(record);
                // 권한 폼 초기화
                const defaultPermissions: any = {};
                Object.keys(PERMISSION_LABELS).forEach(key => {
                  defaultPermissions[key] = record.permissions?.[key as keyof typeof record.permissions] || false;
                });
                permissionsForm.setFieldsValue(defaultPermissions);
                setPermissionsModalVisible(true);
              }}
            >
              권한 설정
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>접근 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          직원 계정 생성
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="직원 계정 생성"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={createForm}
          onFinish={handleCreateUser}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="아이디"
            rules={[{ required: true, message: '아이디를 입력해주세요.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="권한"
            initialValue="employee"
          >
            <Select>
              <Select.Option value="employee">직원</Select.Option>
              <Select.Option value="admin">어드민</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                생성
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="비밀번호 변경"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          onFinish={handleUpdatePassword}
          layout="vertical"
        >
          <Form.Item
            label="사용자"
          >
            <Input value={selectedUser?.username} disabled />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="새 비밀번호"
            rules={[{ required: true, message: '새 비밀번호를 입력해주세요.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                변경
              </Button>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
                setSelectedUser(null);
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="권한 설정"
        open={permissionsModalVisible}
        onCancel={() => {
          setPermissionsModalVisible(false);
          permissionsForm.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={permissionsForm}
          onFinish={handleUpdatePermissions}
          layout="vertical"
        >
          <Form.Item
            label="사용자"
          >
            <Input value={selectedUser?.username} disabled />
          </Form.Item>
          <Form.Item label="권한 설정">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <Form.Item
                key={key}
                name={key}
                valuePropName="checked"
                style={{ marginBottom: 12 }}
              >
                <Checkbox>{label}</Checkbox>
              </Form.Item>
            ))}
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                저장
              </Button>
              <Button onClick={() => {
                setPermissionsModalVisible(false);
                permissionsForm.resetFields();
                setSelectedUser(null);
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;

