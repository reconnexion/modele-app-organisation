import { DatePicker, Form, Input, type FormProps } from 'antd';
import dayjs from 'dayjs';

// Stored as ISO strings, edited as dayjs objects
const dateProps = {
  getValueProps: (value?: string) => ({ value: value && dayjs(value) }),
  normalize: (value?: dayjs.Dayjs) => value?.toISOString()
};

const EventForm = (formProps: FormProps) => (
  <Form {...formProps} layout="vertical">
    <Form.Item label="Titre" name="name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Début" name="startTime" rules={[{ required: true }]} {...dateProps}>
      <DatePicker showTime format="LLL" style={{ width: 260 }} />
    </Form.Item>
    <Form.Item
      label="Fin"
      name="endTime"
      dependencies={['startTime']}
      rules={[
        ({ getFieldValue }) => ({
          validator: (_, value) =>
            !value || !getFieldValue('startTime') || value >= getFieldValue('startTime')
              ? Promise.resolve()
              : Promise.reject(new Error("L'événement doit se terminer après son début"))
        })
      ]}
      {...dateProps}
    >
      <DatePicker showTime format="LLL" style={{ width: 260 }} />
    </Form.Item>
    <Form.Item label="Description" name="content">
      <Input.TextArea rows={6} />
    </Form.Item>
  </Form>
);

export default EventForm;
