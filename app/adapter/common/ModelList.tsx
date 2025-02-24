import { useEffect, useRef } from 'react';
import { Divider, Tooltip, Button, Popconfirm, Popover, message } from 'antd';
import { EyeInvisibleOutlined, DeleteOutlined, SettingOutlined, PictureOutlined, DownOutlined, HolderOutlined } from '@ant-design/icons';
import useModelListStore from '@/app/store/modelList';
import { LLMModel } from '@/app/adapter/interface';
import { changeSelectInServer, deleteCustomModelInServer, saveModelsOrder } from '@/app/adapter/actions';
import Sortable from 'sortablejs';
import { useTranslations } from 'next-intl';

interface ModelListProps {
  providerId: string;
  setCurretEditModal: (model: LLMModel) => void;
  setIsEditModelModalOpen: (open: boolean) => void;
  setIsCustomModelModalOpen: (open: boolean) => void;
}

const ModelList: React.FC<ModelListProps> = ({
  providerId,
  setCurretEditModal,
  setIsEditModelModalOpen,
  setIsCustomModelModalOpen,
}) => {
  const t = useTranslations('Admin.Models');
  const [messageApi, contextHolder] = message.useMessage();
  const { modelList, setModelList, changeSelect, deleteCustomModel } = useModelListStore();
  const listRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  useEffect(() => {
    if (listRef.current) {
      sortableRef.current = Sortable.create(listRef.current, {
        animation: 150,
        handle: '.handle', // 仅允许通过带有 .handle 类的元素拖动
        onStart: (evt) => {
        },
        onEnd: async (evt) => {
          const newModels = [...modelList];
          const [movedItem] = newModels.splice(evt.oldIndex!, 1);
          newModels.splice(evt.newIndex!, 0, movedItem);

          setModelList(newModels);

          // 将新的顺序发送到服务器
          const newOrder = newModels.map((model, index) => ({ modelId: model.id, order: index }));
          try {
            await saveModelsOrder(providerId, newOrder);
            console.log(newOrder)
          } catch (error) {
            console.error('Failed to update order:', error);
          }
        },
      });
    }

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
      }
    };
  }, [modelList, setModelList, providerId]);

  const handleChangeSelect = async (modelName: string, selected: boolean) => {
    await changeSelectInServer(modelName, selected);
    changeSelect(modelName, selected);
  }

  const handleDeleteCustomModel = async (modelName: string,) => {
    await deleteCustomModelInServer(modelName);
    deleteCustomModel(modelName);
  }

  return (
    <>
      <div className='font-medium'>{t('models')}</div>
      <div
        ref={listRef}
        className='text-xs text-gray-700 my-2 pr-2 -ml-4 scrollbar-thin scrollbar-thumb-gray-300'>
        {modelList.filter(i => i.selected).map((item) => (
          <div key={item.id} className='flex flex-row'>
            <HolderOutlined className='cursor-move handle' style={{ color: '#999', cursor: 'move' }} />
            <div className='flex flex-row ml-1 group w-full my-2 items-center h-8 bg-gray-100 rounded-md pl-3 pr-1 justify-between'>
              <div>
                <span className=''>{item.displayName}</span>
                <Divider type="vertical" />
                <span className='text-gray-500' style={{ 'fontSize': '10px' }}>{item.id}</span>
                {
                  item.maxTokens && <>
                    <Divider type="vertical" />
                    <Tooltip title={`${t('conversationUpTo')} ${item.maxTokens} tokens`}>
                      <span className='text-gray-500' style={{ 'fontSize': '10px' }}>{(item.maxTokens as number) / 1024}K</span>
                    </Tooltip>
                  </>
                }
                {
                  item?.supportVision && <><Divider type="vertical" /><Tooltip title={t('supportVision')}>
                    <PictureOutlined style={{ color: '#888' }} />
                  </Tooltip></>
                }
              </div>
              <div className='invisible group-hover:visible'>
                <Tooltip title={t('hide')}>
                  <Button onClick={() => {
                    handleChangeSelect(item.id, false);
                  }} size='small' type='text' icon={<EyeInvisibleOutlined style={{ color: '#888' }} />} />
                </Tooltip>
                <Popconfirm
                  title={t('deleteCustomModel')}
                  description={t('currentModelWillbeDeleted')}
                  onConfirm={() => {
                    handleDeleteCustomModel(item.id);
                    messageApi.success(t('deleteSuccess'))
                  }}
                  okText={t('confirm')}
                  cancelText={t('cancel')}
                >
                  <Button size='small' type='text' icon={<DeleteOutlined style={{ color: '#888' }} />} />
                </Popconfirm>
                <Tooltip title={t('settings')}>
                  <Button size='small' onClick={() => {
                    setCurretEditModal(item);
                    setIsEditModelModalOpen(true);
                  }} type='text' icon={<SettingOutlined style={{ color: '#888' }} />} />
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='mb-4'>
        <Popover placement="bottomLeft"
          trigger="click"
          content={
            <div className='w-96'>
              {
                modelList.filter(i => !i.selected).length === 0 && <div className='text-gray-500 text-xs w-full flex justify-center'>{t('allAdded')}</div>
              }
              {modelList.filter(i => (!i.selected)).length > 0 &&
                modelList.filter(i => (!i.selected)).map((item) => (
                  <div key={item.id}
                    onClick={() => {
                      handleChangeSelect(item.id, true);
                    }}
                    className='hover:bg-gray-100 px-2 py-1 rounded-md cursor-pointer'>
                    <span className='text-xs'>{item.displayName}</span>
                    <Divider type="vertical" />
                    <span className='text-gray-500' style={{ 'fontSize': '10px' }}>{item.id}</span>
                    {item.maxTokens && <>
                      <Divider type="vertical" />
                      <Tooltip title={`${t('conversationUpTo')} ${item.maxTokens} tokens`}>
                        <span className='text-gray-500' style={{ 'fontSize': '10px' }}>{(item.maxTokens as number) / 1024}K</span>
                      </Tooltip>
                    </>
                    }
                    {
                      item?.supportVision && <><Divider type="vertical" /><Tooltip title={t('supportVision')}>
                        <PictureOutlined style={{ color: '#888' }} />
                      </Tooltip></>
                    }
                  </div>
                )
                )
              }
            </div>} arrow={false}>
          <Button size='small'
            style={{ 'fontSize': '11px' }}
            icon={<DownOutlined />}
            iconPosition='end'
          >{t('addModel')}</Button>
        </Popover>
        <Button
          size='small'
          style={{ 'fontSize': '11px' }}
          className='ml-2'
          onClick={() => {
            setIsCustomModelModalOpen(true);
          }}
        >{t('customModel')}</Button>
      </div>
    </>
  );
};

export default ModelList;