'use client';
import { Pagination } from 'antd';
import { useTranslations } from 'next-intl';

interface CustomPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize?: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  loading?: boolean;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
}

const CustomPagination = ({
  current,
  total,
  pageSize,
  onChange,
  onShowSizeChange,
  loading = false,
  pageSizeOptions = ['12', '24', '48', '60', '96', '120', '240', '480', '600'],
  showSizeChanger = true
}: CustomPaginationProps) => {
  const t = useTranslations('Common');

  if (total <= 0) return null;

  const startItem = ((current - 1) * pageSize) + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-col items-center mt-8 space-y-4">
      <div className="text-sm text-gray-500 font-medium">
        {t('total')} <span className="text-blue-600 font-semibold">{total}</span> {t('items')}，
        {t('currentDisplay')} <span className="text-blue-600 font-semibold">{startItem}</span> {t('to')} <span className="text-blue-600 font-semibold">{endItem}</span>
      </div>
      <div className="pagination-container">
        <Pagination
          current={current}
          total={total}
          pageSize={pageSize}
          onChange={onChange}
          showSizeChanger={showSizeChanger}
          pageSizeOptions={pageSizeOptions}
          onShowSizeChange={onShowSizeChange}
          disabled={loading}
          className="custom-pagination"
          showTotal={(total, range) => 
            `${range[0]}-${range[1]} ${t('itemsPerPage')}`
          }
          locale={{
            items_per_page: `${t('itemsPerPage')}`,
            jump_to: t('jumpTo'),
            jump_to_confirm: t('confirm'),
            page: t('page'),
            prev_page: '上一页',
            next_page: '下一页',
            prev_5: '向前 5 页',
            next_5: '向后 5 页',
            prev_3: '向前 3 页',
            next_3: '向后 3 页'
          }}
        />
      </div>

      <style jsx global>{`
        .pagination-container {
          background: white;
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #f0f0f0;
        }

        .custom-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .custom-pagination .ant-pagination-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin: 0 4px;
          background: white;
          transition: all 0.2s ease;
          font-weight: 500;
          min-width: 36px;
          height: 36px;
          line-height: 34px;
        }

        .custom-pagination .ant-pagination-item:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .custom-pagination .ant-pagination-item-active {
          background: white;
          border-color: #3b82f6;
          color: #3b82f6;
          font-weight: 600;
          box-shadow: none;
        }

        .custom-pagination .ant-pagination-item-active:hover {
          background: white;
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .custom-pagination .ant-pagination-prev,
        .custom-pagination .ant-pagination-next {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
          font-weight: 500;
          min-width: 36px;
          height: 36px;
          line-height: 34px;
        }

        .custom-pagination .ant-pagination-prev:hover,
        .custom-pagination .ant-pagination-next:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .custom-pagination .ant-pagination-disabled,
        .custom-pagination .ant-pagination-disabled:hover {
          background: #f9fafb;
          border-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .custom-pagination .ant-pagination-jump-prev,
        .custom-pagination .ant-pagination-jump-next {
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .custom-pagination .ant-pagination-jump-prev:hover,
        .custom-pagination .ant-pagination-jump-next:hover {
          color: #3b82f6;
        }

        .custom-pagination .ant-pagination-options {
          margin-left: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .custom-pagination .ant-pagination-options-size-changer {
          margin-right: 8px;
        }

        .custom-pagination .ant-pagination-options-size-changer .ant-select {
          border-radius: 6px;
        }

        .custom-pagination .ant-pagination-options-size-changer .ant-select-selector {
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          height: 32px;
        }

        .custom-pagination .ant-pagination-options-size-changer .ant-select-selector:hover {
          border-color: #3b82f6;
        }

        .custom-pagination .ant-pagination-options-quick-jumper {
          font-size: 14px;
          color: #6b7280;
        }

        .custom-pagination .ant-pagination-options-quick-jumper input {
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          width: 60px;
          height: 32px;
          margin: 0 8px;
          text-align: center;
          font-size: 14px;
        }

        .custom-pagination .ant-pagination-options-quick-jumper input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .custom-pagination .ant-pagination-options-quick-jumper button {
          background: #3b82f6;
          border: 1px solid #3b82f6;
          color: white;
          border-radius: 6px;
          height: 32px;
          padding: 0 12px;
          font-size: 14px;
          margin-left: 8px;
          transition: all 0.2s ease;
        }

        .custom-pagination .ant-pagination-options-quick-jumper button:hover {
          background: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .custom-pagination .ant-pagination-total-text {
          font-size: 14px;
          color: #6b7280;
          margin-right: 16px;
        }

        @media (max-width: 768px) {
          .pagination-container {
            padding: 8px 12px;
          }
          
          .custom-pagination {
            flex-direction: column;
            gap: 12px;
          }

          .custom-pagination .ant-pagination-item,
          .custom-pagination .ant-pagination-prev,
          .custom-pagination .ant-pagination-next {
            min-width: 32px;
            height: 32px;
            line-height: 30px;
            margin: 0 2px;
          }
          
          .custom-pagination .ant-pagination-options {
            margin-left: 0;
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .custom-pagination .ant-pagination-options-quick-jumper {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomPagination;
