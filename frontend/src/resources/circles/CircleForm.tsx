import { useMemo } from 'react';
import { Form, Input, Select, type FormProps } from 'antd';
import { arrayOf } from '@activitypods/refine-providers';
import MarkdownInput from '../../common/MarkdownInput';
import { circleOptions, getDescendants, useCircles } from './common';

const CircleForm = ({ circleId, ...formProps }: FormProps & { circleId?: string }) => {
  const { circles } = useCircles();
  // A circle cannot be part of itself or of one of its sub-circles
  const parentOptions = useMemo(() => circleOptions(circles, getDescendants(circles, circleId)), [circles, circleId]);

  return (
    <Form {...formProps} layout="vertical">
      <Form.Item label="Nom" name="pair:label" rules={[{ required: true, whitespace: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Fait partie de" name="pair:partOf">
        <Select allowClear showSearch optionFilterProp="label" options={parentOptions} placeholder="Aucun cercle" />
      </Form.Item>
      <Form.Item label="Raison d'être" name="hc:purpose">
        <MarkdownInput />
      </Form.Item>
      <Form.Item label="Redevabilités" name="hc:accountabilities">
        <MarkdownInput />
      </Form.Item>
      <Form.Item label="Domaine" name="hc:domain">
        <Input />
      </Form.Item>
      <Form.Item
        label="Canaux de communication"
        name="pair:homePage"
        extra="Adresses web, séparées par des espaces"
        getValueProps={value => ({ value: arrayOf(value) })}
        rules={[
          {
            validator: (_, value) =>
              arrayOf<string>(value).every(url => URL.canParse(url))
                ? Promise.resolve()
                : Promise.reject(new Error('Adresse web invalide'))
          }
        ]}
      >
        <Select mode="tags" open={false} tokenSeparators={[' ', ',', '\n']} suffixIcon={null} />
      </Form.Item>
    </Form>
  );
};

export default CircleForm;
