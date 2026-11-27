import { useForm } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Form, Input, type FormProps } from 'antd';
import MarkdownField from '../common/MarkdownField';
import MarkdownInput from '../common/MarkdownInput';
import { CreateSide, EditSide, ShowSide } from '../layout/SidePanels';

// Resources with only a title and a Markdown description, for now projects and documents

const DescribedForm = (formProps: FormProps) => (
  <Form {...formProps} layout="vertical">
    <Form.Item label="Titre" name="pair:label" rules={[{ required: true, whitespace: true }]}>
      <Input />
    </Form.Item>
    <Form.Item label="Description" name="pair:description">
      <MarkdownInput rows={10} />
    </Form.Item>
  </Form>
);

export const DescribedShow = () => {
  const { result: record, query } = useShow();
  return (
    <ShowSide isLoading={query.isLoading} title={record?.['pair:label']}>
      <MarkdownField value={record?.['pair:description']} />
    </ShowSide>
  );
};

export const DescribedCreate = ({ title }: { title: string }) => {
  const { formProps, saveButtonProps } = useForm({ redirect: 'show' });
  return (
    <CreateSide title={title} saveButtonProps={saveButtonProps}>
      <DescribedForm {...formProps} />
    </CreateSide>
  );
};

export const DescribedEdit = ({ title }: { title: string }) => {
  const { formProps, saveButtonProps, query } = useForm({ redirect: 'show' });
  return (
    <EditSide title={title} saveButtonProps={saveButtonProps} isLoading={query?.isLoading}>
      <DescribedForm {...formProps} />
    </EditSide>
  );
};
