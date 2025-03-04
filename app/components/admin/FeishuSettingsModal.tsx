import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useTranslations } from 'next-intl';
import { getFeishuAuthInfo } from '@/app/(auth)/actions';

type FeishuSettingsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

interface FormValues {
  appId: string;
  appSecret: string;
}

const FeishuSettingsModal: React.FC<FeishuSettingsModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const t = useTranslations('Admin.Models');
  const [isFeishuActive, setIsFeishuActive] = useState(false);
  const [feishuSettingForm] = Form.useForm<FormValues>();

  useEffect(() => {
    if (isModalOpen) {
      const fetchSettings = async () => {
        const activeAuthProvides = await getFeishuAuthInfo();
        setIsFeishuActive(activeAuthProvides.isActive);
        feishuSettingForm.setFieldsValue({
          appId: activeAuthProvides.appId,
          appSecret: activeAuthProvides.appSecret,
        })
      }
      fetchSettings();
    }
  }, [isModalOpen, feishuSettingForm]);

  return (
    <Modal
      title='设置飞书登录'
      maskClosable={false}
      keyboard={false}
      centered={true}
      okText={t('okText')}
      cancelText={t('cancelText')}
      open={isModalOpen}
      footer={<Button onClick={() => setIsModalOpen(false)}>关闭</Button>}
    >
      <div className='mt-4'>
        <Form
          layout="vertical"
          form={feishuSettingForm}
        >
          <div className='mt-2 mb-6 bg-slate-100 p-4 rounded-md'>
            <span className='font-medium text-base'>当前状态</span>
            {isFeishuActive ?
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='ml-2 text-sm'>已启用</span>
              </div> :
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                <span className='ml-2 text-sm'>未启用</span>
              </div>
            }
            <span className='text-gray-500'>如需启用或禁用飞书登录，请修改根目录 .env 文件，并重新编译并启动程序，详情请查看帮助文档。</span>
          </div>
          <Form.Item
            name='appId'
            label={<span className='font-medium'>App ID</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name='appSecret'
            label={<span className='font-medium'>App Secret</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input type='text' disabled />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default FeishuSettingsModal;