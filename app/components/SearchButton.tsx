import React from 'react';
import { Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

interface SearchButtonProps {
  searchEnable: boolean;
  localSearchEnable: boolean;
  onToggle: () => void;
}

const SearchButton: React.FC<SearchButtonProps> = ({
  searchEnable,
  localSearchEnable,
  onToggle,
}) => {
  if (!searchEnable) {
    return <div></div>;
  }

  return (
    <Button
      shape="round"
      color={localSearchEnable ? "primary" : 'default'}
      variant={localSearchEnable ? "filled" : 'outlined'}
      className="mr-2"
      icon={<GlobalOutlined />}
      onClick={onToggle}
    >
      联网搜索
    </Button>
  );
};

export default SearchButton; 