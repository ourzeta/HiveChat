'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { EmojiPicker } from '@/app/components/EmojiPicker';
import { useTranslations } from 'next-intl';
import { BotType } from '@/app/db/schema';

interface BotFormProps {
  mode: 'create' | 'edit';
  initialData?: BotType;
  onSubmit: (values: BotFormValues) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export interface BotFormValues {
  title: string;
  desc?: string;
  prompt: string;
  avatar: string;
  avatarType: 'emoji' | 'url';
}

const BotForm: React.FC<BotFormProps> = ({
  mode,
  initialData,
  onSubmit,
  loading = false,
  onCancel,
  showCancelButton = false
}) => {
  const t = useTranslations('Chat');
  const tCommon = useTranslations('Common');
  const [form] = Form.useForm();
  const [selectedEmoji, setSelectedEmoji] = useState('🤖');
  const [avatarType, setAvatarType] = useState<'emoji' | 'url'>('emoji');

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setSelectedEmoji(initialData.avatar);
      setAvatarType(initialData.avatarType);
      form.setFieldsValue({
        title: initialData.title,
        desc: initialData.desc,
        prompt: initialData.prompt,
        avatar: initialData.avatar,
        avatarType: initialData.avatarType
      });
    }
  }, [initialData, mode, form]);

  const handleFinish = async (values: any) => {
    try {
      const formValues: BotFormValues = {
        title: values.title,
        desc: values.desc,
        prompt: values.prompt,
        avatar: avatarType === 'emoji' ? selectedEmoji : values.avatar,
        avatarType: avatarType
      };
      await onSubmit(formValues);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleAvatarTypeChange = (value: 'emoji' | 'url') => {
    setAvatarType(value);
    if (value === 'emoji') {
      form.setFieldValue('avatar', selectedEmoji);
    } else {
      form.setFieldValue('avatar', '');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    if (avatarType === 'emoji') {
      form.setFieldValue('avatar', emoji);
    }
  };

  return (
    <div className="w-full">
      {mode === 'create' && (
        <>
          <h1 className='text-xl mt-4 text-center'>{t('createBot')}</h1>
          <p className='text-gray-400 mb-8 text-center'>创建的智能体仅自己查看和使用</p>
        </>
      )}
      
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        className='w-full'
        initialValues={{
          avatarType: 'emoji',
          avatar: selectedEmoji
        }}
      >
        <Form.Item
          label={<span className='font-medium'>{t('avatarType')}</span>}
          name="avatarType"
          rules={[{ required: true, message: t('selectAvatarTypeRequired') }]}
        >
          <Select
            size="large"
            placeholder={t('selectAvatarType')}
            onChange={handleAvatarTypeChange}
            value={avatarType}
          >
            <Select.Option value="emoji">{t('emoji')}</Select.Option>
            <Select.Option value="url">{t('imageUrl')}</Select.Option>
          </Select>
        </Form.Item>

        {avatarType === 'emoji' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectEmoji')}
            </label>
            <div className="flex justify-center">
              <EmojiPicker
                currentEmoji={selectedEmoji}
                onEmojiSelect={handleEmojiSelect}
              />
            </div>
          </div>
        )}

        <Form.Item
          label={<span className='font-medium'>{t('avatar')}</span>}
          name="avatar"
          rules={[{ required: true, message: t('enterAvatar') }]}
        >
          {avatarType === 'emoji' ? (
            <Input 
              size="large" 
              value={selectedEmoji}
              placeholder={t('emoji')}
              readOnly
            />
          ) : (
            <Input 
              size="large" 
              placeholder={t('enterImageUrl')}
            />
          )}
        </Form.Item>

        <Form.Item 
          label={<span className='font-medium'>{t('botName')}</span>} 
          name='title'
          rules={[{ required: true, message: t('botNameNotice') }]}
        >
          <Input size="large" placeholder={t('botNameNotice')} />
        </Form.Item>

        <Form.Item label={<span className='font-medium'>{t('botDesc')}</span>} name='desc'>
          <Input.TextArea size="large" placeholder={t('botDescNotice')} rows={3} />
        </Form.Item>

        <Form.Item 
          label={<span className='font-medium'>{t('prompt')}</span>} 
          name='prompt'
          rules={[{ required: true, message: '请输入角色设定' }]}
        >
          <Input.TextArea
            size="large"
            autoSize={{ minRows: 5, maxRows: 12 }}
            placeholder={t('promptNotice')} 
          />
        </Form.Item>

        <Form.Item className={mode === 'edit' ? 'mb-0 text-right' : ''}>
          {showCancelButton && (
            <Button 
              onClick={onCancel} 
              className="mr-2"
              size={mode === 'create' ? 'large' : undefined}
            >
              {tCommon('cancel')}
            </Button>
          )}
          <Button
            type="primary"
            size={mode === 'create' ? 'large' : undefined}
            shape={mode === 'create' ? 'round' : undefined}
            className={mode === 'create' ? 'w-full' : ''}
            htmlType="submit"
            loading={loading}
          >
            {mode === 'create' ? t('createBot') : tCommon('ok')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BotForm;