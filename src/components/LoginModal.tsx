import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';

interface LoginModalProps {
  visible: boolean;
  onLogin: (user: { id: number; name: string }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { name: string }) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: values.name }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success(`환영합니다, ${data.user.name}님!`);
          onLogin(data.user);
          form.resetFields();
        } else {
          message.error('로그인에 실패했습니다.');
        }
      } else {
        message.error('로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      message.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="로그인"
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      centered
    >
      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="이름"
          rules={[
            { required: true, message: '이름을 입력해주세요.' },
            { min: 2, message: '이름은 2자 이상이어야 합니다.' },
            { max: 50, message: '이름은 50자 이하여야 합니다.' }
          ]}
        >
          <Input
            placeholder="이름을 입력하세요"
            size="large"
            autoFocus
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
          >
            로그인
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginModal;
