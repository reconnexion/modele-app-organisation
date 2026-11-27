import { useTable } from '@refinedev/antd';
import { useNavigation, useResourceParams, type BaseRecord } from '@refinedev/core';
import { Table, type TableColumnsType } from 'antd';

type SimpleListProps = { columns?: TableColumnsType<BaseRecord> };

// Clicking a row opens the record in the side panel
const SimpleList = ({ columns = [] }: SimpleListProps) => {
  const { show } = useNavigation();
  const { resource, id } = useResourceParams();
  // The URL is the one of the record opened in the panel
  const { tableProps } = useTable({
    syncWithLocation: false,
    sorters: { initial: [{ field: 'pair:label', order: 'asc' }] }
  });

  return (
    <Table
      {...tableProps}
      rowKey="id"
      size="middle"
      onRow={record => ({
        onClick: () => show(resource!.name, record.id!),
        style: { cursor: 'pointer', background: record.id === id ? '#e6f7f1' : undefined }
      })}
      columns={[{ title: 'Nom', dataIndex: 'pair:label', sorter: true }, ...columns]}
    />
  );
};

export default SimpleList;
