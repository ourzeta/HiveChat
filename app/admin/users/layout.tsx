'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MenuProps } from 'antd';
import { useTranslations } from 'next-intl';


const UserListPage = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const t = useTranslations('Admin.Users');
  const pathname = usePathname();
  const [current, setCurrent] = useState('');

  const items = [
    {
      label: <Link href="/admin/users/list">{t('userList')}</Link>,
      key: 'list',
    },
    {
      label: <Link href="/admin/users/group">{t('groupManagement')}</Link>,
      key: 'group',
    },
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    setCurrent(e.key);
  };

  useEffect(() => {
    if (pathname === '/admin/users/list') {
      setCurrent('list');
    } else if (pathname === '/admin/users/group') {
      setCurrent('group');
    }
  }, [pathname]);
  return (
    <div className='container max-w-4xl mb-6 px-4 md:px-0 pt-4'>
      <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
      {children}
    </div>
  );
};

export default UserListPage;