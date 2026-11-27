import { Input, Tabs, Typography } from 'antd';
import MarkdownField from './MarkdownField';

type MarkdownInputProps = { value?: string; onChange?: (value: string) => void; rows?: number };

const MarkdownInput = ({ value, onChange, rows = 6 }: MarkdownInputProps) => (
  <Tabs
    size="small"
    tabBarStyle={{ marginBottom: 8 }}
    items={[
      {
        key: 'write',
        label: 'Écrire',
        children: <Input.TextArea value={value} onChange={e => onChange?.(e.target.value)} rows={rows} />
      },
      {
        key: 'preview',
        label: 'Aperçu',
        children: value ? (
          <MarkdownField value={value} />
        ) : (
          <Typography.Text type="secondary">Rien à afficher</Typography.Text>
        )
      }
    ]}
  />
);

export default MarkdownInput;
