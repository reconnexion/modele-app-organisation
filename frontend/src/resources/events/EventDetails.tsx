import { DateField } from '@refinedev/antd';
import { Descriptions, Typography } from 'antd';
import { CircleTags, useCircles } from '../circles/common';

const EventDetails = ({ record }: { record?: Record<string, any> }) => {
  const { circles } = useCircles();
  const circle = circles.find(circle => circle.id === record?.['pair:concerns']);
  return (
    <>
      <Descriptions column={1}>
        {circle && (
          <Descriptions.Item label="Cercle">
            <CircleTags circles={[circle]} />
          </Descriptions.Item>
        )}
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
};

export default EventDetails;
