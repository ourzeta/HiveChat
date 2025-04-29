import React, { memo, useState, useCallback } from 'react';
import { Button, Input } from "antd";
import { Square } from '@icon-park/react';
import { ArrowUpOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

interface ChatInputProps {
  responseStatus: "done" | "pending";
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (message: string) => void;
  onStop: () => void;
}

const ChatInput = memo(({
  responseStatus,
  onPaste,
  onSubmit,
  onStop
}: ChatInputProps) => {
  const t = useTranslations('Chat');
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        // Command/Ctrl + Enter: 插入换行
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newValue = target.value.substring(0, start) + '\n' + target.value.substring(end);
        setInputValue(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
        return;
      }

      e.preventDefault();
      if (inputValue.trim() === '' || responseStatus === 'pending') return;
      onSubmit(inputValue);
      setInputValue('');
    }
  }, [inputValue, responseStatus, onSubmit]);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() === '') return;
    onSubmit(inputValue);
    setInputValue('');
  }, [inputValue, onSubmit]);

  return (
    <div className='flex h-full max-w-3xl w-full relative pl-2 pr-2'>
      <Input.TextArea
        onChange={handleInputChange}
        value={inputValue}
        autoFocus={true}
        onPaste={onPaste}
        onKeyDown={handleKeyDown}
        placeholder={t('inputPlaceholder')}
        className='scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-rou'
        style={{ paddingRight: '5em', resize: 'none', scrollbarColor: '#eaeaea transparent' }}
      />

      {responseStatus === 'done' && (
        <Button
          type="primary"
          size='small'
          style={{ position: 'absolute' }}
          className='absolute right-4 bottom-2'
          shape="circle"
          onClick={handleSubmit}
          icon={<ArrowUpOutlined />}
        />
      )}

      {responseStatus === 'pending' && (
        <Button
          type="primary"
          size='small'
          style={{ position: 'absolute' }}
          className='absolute right-4 bottom-2'
          shape="circle"
          onClick={onStop}
          icon={<Square theme="filled" size="12" fill="#ffffff" />}
        />
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
export default ChatInput; 