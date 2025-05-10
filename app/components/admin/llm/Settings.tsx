'use client'
import Link from 'next/link';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Switch, Skeleton, Avatar, message, Popconfirm, Modal } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { getLLMInstance } from '@/app/utils';
import { useTranslations } from 'next-intl';
import { saveToServer } from '@/app/admin/llm/actions';
import { fetchLlmModels } from '@/app/admin/llm/actions';
import useModelListStore from '@/app/store/modelList';
import CheckApiModal from '@/app/components/admin/llm/CheckApiModal';
import EditModelModal from '@/app/components/admin/llm/EditModelModal';
import AddModelModal from '@/app/components/admin/llm/AddModelModal';
import RenameProviderModal from '@/app/components/admin/llm/RenameProviderModal';
import ModelList from '@/app/components/admin/llm/ModelList';
import { LLMModel } from '@/types/llm';
import { getLlmOriginConfigByProvider } from '@/app/utils/llms';
import { deleteCustomProviderInServer } from '@/app/admin/llm/actions';
import { useRouter } from "next/navigation";

type FormValues = {
  isActive: boolean;
  apikey: string;
  endpoint: string;
}

const Settings = (props: { providerId: string }) => {
  const router = useRouter();
  const { allProviderList, initModelList, toggleProvider, deleteCustomProvider } = useModelListStore();
  const provider = allProviderList.find((i) => i.id === props.providerId)!;
  const t = useTranslations('Admin.Models');
  const [isClient, setIsClient] = useState(false);
  const [isPending, setIsPending] = useState(true);

  const [isCheckApiModalOpen, setIsCheckApiModalOpen] = useState(false);
  const [isCustomModelModalOpen, setIsCustomModelModalOpen] = useState(false);
  const [isRenameProviderModalOpen, setIsRenameProviderModalOpen] = useState(false);
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState(false);
  const [curretEditModal, setCurretEditModal] = useState<LLMModel>();
  const [checkResult, setCheckResult] = useState('init');
  const [errorMessage, setErrorMessage] = useState('');
  const [inputEndpoint, setInputEndpoint] = useState('');
  const [form] = Form.useForm();

  const getEndpointBaseUrl = (providerId: string, inputUrl?: string | null) => {
    if (inputUrl) {
      return inputUrl;
    }
    const endpointMap = {
      'claude': 'https://api.anthropic.com/v1',
      'deepseek': 'https://api.deepseek.com/v1',
      'volcengine': 'https://ark.cn-beijing.volces.com/api/v3',
      'gemini': 'https://generativelanguage.googleapis.com',
      'moonshot': 'https://api.moonshot.cn/v1',
      'ollama': 'http://127.0.0.1:11434/v1',
      'openai': 'https://api.openai.com/v1',
      'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      'qianfan': 'https://qianfan.baidubce.com/v2',
      'siliconflow': 'https://api.siliconflow.cn/v1',
      'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
      'hunyuan': 'https://api.hunyuan.cloud.tencent.com/v1',
      'openrouter': 'https://openrouter.ai/api/v1',
      'grok': 'https://api.x.ai/v1',
    }
    return endpointMap[providerId as keyof typeof endpointMap];
  }

  const getHelpLinks = (providerId: string) => {
    const helpLinks = {
      'openai': 'https://www.hivechat.net/docs/providers/openai',
      'claude': 'https://www.hivechat.net/docs/providers/claude',
      'gemini': 'https://www.hivechat.net/docs/providers/gemini',
      'moonshot': 'https://www.hivechat.net/docs/providers/moonshot',
      'qwen': 'https://www.hivechat.net/docs/providers/qwen',
      'deepseek': 'https://www.hivechat.net/docs/providers/deepseek',
      'volcengine': 'https://www.hivechat.net/docs/providers/volcengine',
      'qianfan': 'https://www.hivechat.net/docs/providers/qianfan',
      'siliconflow': 'https://www.hivechat.net/docs/providers/siliconflow',
      'ollama': 'https://www.hivechat.net/docs/providers/ollama',
      'hunyuan': 'https://www.hivechat.net/docs/providers/hunyuan',
      'zhipu': 'https://www.hivechat.net/docs/providers/zhipu',
      'grok': 'https://www.hivechat.net/docs/providers/xai',
      'openrouter': 'https://www.hivechat.net/docs/providers/openrouter',
    };
    const providers = Object.keys(helpLinks);
    if (providers.includes(providerId)) {
      return helpLinks[providerId as keyof typeof helpLinks];
    } else {
      return 'https://k2swpw8zgf.feishu.cn/wiki/J3FtwGumMi7k0vktB41cHvjTnTg';
    }
  }
  const chatbot = getLLMInstance(props.providerId)
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteProvider = async (providerId: string) => {
    try {
      message.success('删除成功');
      await deleteCustomProviderInServer(providerId);
      deleteCustomProvider(providerId);
      router.push(`/admin/llm`);
    } catch (error) {
      console.error('删除服务商失败:', error);
      message.error('删除失败，请检查网络或后台服务。');
    }
  }

  useEffect(() => {
    const fetchLlmConfig = async (): Promise<void> => {
      const result = await getLlmOriginConfigByProvider(provider.id);
      const endpointUrl = getEndpointBaseUrl(provider.id, result.endpoint?.trim());
      form.setFieldsValue({
        isActive: result.isActive || false,
        apikey: result.apikey || '',
        endpoint: endpointUrl,
      });
      setInputEndpoint(endpointUrl);
    };

    const fetchModelList = async (): Promise<void> => {
      const result = await fetchLlmModels(provider.id);
      initModelList(result)
    }

    const initData = async () => {
      try {
        await Promise.all([fetchLlmConfig(), fetchModelList()]);
        setIsPending(false);
      } catch (error) {
        setIsPending(false);
      }
    };

    initData();
  }, [form, initModelList, provider]);

  if (!isClient) return null;

  const onFinish = (values: FormValues) => {
    toggleProvider(provider.id, values.isActive);
    saveToServer(provider.id, { ...values, providerName: provider.providerName });
  };

  const checkApi = async (modelId: string) => {
    setCheckResult('pending')
    const result = await chatbot.check(modelId, form.getFieldValue('apikey'), form.getFieldValue('endpoint'));
    if (result.status === 'success') {
      setCheckResult('success');
      setErrorMessage('');
    } else {
      setCheckResult('error');
      setErrorMessage(result.message || '');
    }
  };

  const getEndpointExtraNotice = (providerId: string, inputEndpoint: string) => {
    switch (providerId) {
      case 'claude':
        return <span className='ml-3'>{inputEndpoint + '/messages'}</span>
      case 'gemini':
        return <span className='ml-3'>{inputEndpoint + '/v1beta/models/${model}:streamGenerateContent?alt=sse'}</span>
      default:
        return <span className='ml-3'>{inputEndpoint + '/chat/completions'}</span>
    }
  }
  return (
    isPending ? <Skeleton active style={{ 'marginTop': '1.5rem' }} /> :
      <div className='flex w-full flex-col'>
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
          <div className='flex flex-row justify-between my-4 items-center'>
            <div className='flex items-center justify-center'>
              {provider?.providerLogo ?
                <Avatar
                  style={{ border: '1px solid #ddd', padding: '0.2rem' }}
                  src={provider.providerLogo}
                />
                :
                <Avatar
                  style={{ backgroundColor: '#1c78fa' }}
                >{provider?.providerName.charAt(0)}</Avatar>
              }
              <div className='flex flex-col ml-2'>
                <h2 className='font-medium text-lg mb-0 leading-5'>{provider?.providerName}
                  {provider?.type === 'custom' &&
                    <Button
                      size='small'
                      type='text'
                      className='ml-2'
                      onClick={() => {
                        setIsRenameProviderModalOpen(true);
                      }}>
                      <EditOutlined style={{ fontSize: '12px', 'color': '#666' }} />
                    </Button>
                  }
                </h2>
                <span className='text-xs text-gray-400'>{provider?.id}</span>
              </div>
            </div>
            <Form.Item name='isActive' style={{ 'margin': '0' }}>
              <Switch onChange={() => {
                form.submit();
              }} />
            </Form.Item>
          </div>
          <Form.Item label={<span className='font-medium'>API Key</span>} name='apikey'>
            <Input
              onBlur={() => {
                form.submit();
              }
              }
            />
          </Form.Item>
          <div className='felx text-sm text-gray-600 -mt-6 mb-2'>
            <Link
              href={getHelpLinks(props.providerId)}
              target='_blank'
            >
              <Button
                type='link'
                style={{ padding: '0' }}
              >
                {t('configGuide')}
              </Button>
            </Link>
          </div>
          {
            props.providerId === 'ollama' || provider?.type === 'custom' ?
              <Form.Item
                label={<span className='font-medium'>{t('serviceEndpoint')}</span>}
                name='endpoint'
                extra={<span className='ml-3'>{inputEndpoint + '/chat/completions'}</span>}
              >
                <Input
                  type='url'
                  value={inputEndpoint}
                  onChange={(e) => setInputEndpoint(e.target.value)}
                  onBlur={() => {
                    form.submit();
                  }
                  }
                />
              </Form.Item> :
              <Form.Item
                label={<span className='font-medium'>{t('endpoint')} ({t('optional')})</span>}
                name='endpoint'
                extra={getEndpointExtraNotice(props.providerId, inputEndpoint)}
              >
                <Input
                  type='url'
                  value={inputEndpoint}
                  onChange={(e) => setInputEndpoint(e.target.value)}
                  onBlur={() => {
                    form.submit();
                  }
                  }
                />
              </Form.Item>
          }
        </Form>
        <div className='flex flex-col -mt-2 mb-2'>
          <div className='font-medium'>{t('testConnect')}</div>
          <div className='my-2 flex flex-row items-center'>
            <Button loading={checkResult === 'pending'} onClick={() => {
              setIsCheckApiModalOpen(true);
            }}>{t('check')}</Button>
            <div className='ml-2 flex flex-row items-center' >
              {checkResult === 'success' &&
                <>
                  <CheckCircleOutlined style={{ color: 'green', fontSize: '16px' }} />
                  <span className="text-green-700 ml-1 text-sm">{t('checkSuccess')}</span>
                </>}
              {checkResult === 'error' &&
                <>
                  <CloseCircleOutlined style={{ color: '#f87171', fontSize: '16px' }} />
                  <span className="text-red-400 ml-1 text-sm">{t('checkFail')}</span>
                </>}
            </div>
          </div>
        </div>
        {checkResult === 'error' &&
          <div className='overflow-x-auto mb-4 bg-red-50 rounded-md p-1 text-xs'>
            <div className='overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-red-50 scrollbar-track-rounded-full scrollbar-thumb-rounded-full'>
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  [
                    rehypeHighlight,
                    {
                      detect: false,
                      ignoreMissing: true,
                    },
                  ],
                ]}
              >{errorMessage}</Markdown>
            </div>
          </div>
        }
        <ModelList
          providerId={provider?.id}
          providerName={provider?.providerName}
          setCurretEditModal={setCurretEditModal}
          setIsEditModelModalOpen={setIsEditModelModalOpen}
          setIsCustomModelModalOpen={setIsCustomModelModalOpen}
        />
        {provider?.type === 'custom' &&
          <div className='w-full flex flex-row-reverse p-2'>
            <Popconfirm
              title="删除提示"
              description="确定删除此服务商吗？"
              onConfirm={() => {
                handleDeleteProvider(props.providerId)
              }}
              okText={t('confirm')}
              cancelText={t('cancel')}
            >
              <Button
                size='small'
                color="blue"
                variant="text"
              >
                <span className='text-gray-400 text-xs'>
                  删除此服务商
                </span>
              </Button>
            </Popconfirm>
          </div>
        }
        <CheckApiModal
          isCheckApiModalOpen={isCheckApiModalOpen}
          setIsCheckApiModalOpenOpen={setIsCheckApiModalOpen}
          startCheck={checkApi}
        />

        <AddModelModal
          isCustomModelModalOpen={isCustomModelModalOpen}
          setIsCustomModelModalOpen={setIsCustomModelModalOpen}
          providerId={provider?.id}
          providerName={provider?.providerName}
        />
        <EditModelModal
          model={curretEditModal}
          isEditModelModalOpen={isEditModelModalOpen}
          setIsEditModelModalOpen={setIsEditModelModalOpen}
          providerId={provider?.id}
          providerName={provider?.providerName}
        />
        <RenameProviderModal
          isModalOpen={isRenameProviderModalOpen}
          setIsModalOpen={setIsRenameProviderModalOpen}
          providerId={provider?.id}
          providerName={provider?.providerName}
        />
      </div>
  );
};

export default Settings;
