import { DateField } from '@refinedev/antd';
import { Descriptions, Typography } from 'antd';

const EventDetails = ({ record }: { record?: Record<string, any> }) => (
  <>
    <Descriptions column={1}>
      <Descriptions.Item label="Début">
        {record?.startTime && <DateField value={record.startTime} format="LLL" />}
      </Descriptions.Item>
      {record?.endTime && (
        <Descriptions.Item label="Fin">
          <DateField value={record.endTime} format="LLL" />
        </Descriptions.Item>
      )}
    </Descriptions>
    {record?.content && (
      <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{record.content}</Typography.Paragraph>
    )}
  </>
);

export default EventDetails;
