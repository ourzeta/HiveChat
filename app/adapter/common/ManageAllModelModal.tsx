import React from 'react';
import { Modal, Tooltip, Divider, Button } from 'antd';
import { PictureOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import useModelListStore from '@/app/store/modelList';
import { changeSelectInServer } from '@/app/adapter/actions';
import { useTranslations } from 'next-intl';

type ManageAllModelModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  providerId: string;
};

const ManageAllModelModal: React.FC<ManageAllModelModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  providerId,
}) => {
  const t = useTranslations('Admin.Models');
  const { modelList, changeSelect } = useModelListStore();

  const handleChangeSelect = async (modelName: string, selected: boolean) => {
    changeSelect(modelName, selected);
    await changeSelectInServer(modelName, selected);
  }

  return (
    <Modal
      title="模型管理"
      centered={true}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={
        <Button onClick={() => setIsModalOpen(false)}>
          关闭
        </Button>
      }
    >
      <div className='mt-4'>
        <div>
          <div className=''>
            {
              modelList.length === 0 && <div className='text-gray-500 text-xs w-full flex justify-center'>暂时无可添加模型</div>
            }
            {modelList.length > 0 &&
              modelList.map((item) => (
                <div
                  key={item.id}
                  className='flex flew-row h-10 hover:bg-gray-100 bg-gray-100 px-4 py-1 mt-2 rounded-md justify-between items-center'
                >
                  <div>
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
                    }</div>
                  {
                    item.selected ? <Button size="small" onClick={() => {
                      console.log('item.id  ', item.id)
                      handleChangeSelect(item.id, false);
                    }}
                      icon={<MinusOutlined />} />
                      :
                      <Button size="small" type='primary' onClick={() => {
                        handleChangeSelect(item.id, true);
                      }}
                        icon={<PlusOutlined />} />
                  }
                </div>
              )
              )
            }
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ManageAllModelModal;