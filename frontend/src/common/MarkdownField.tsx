import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography } from 'antd';

// Keep the line returns typed by the users, as in OrganiGraph
const components: Components = {
  p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-wrap' }} {...props} />
};

const MarkdownField = ({ value }: { value?: string }) =>
  value ? (
    <Typography>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {value}
      </Markdown>
    </Typography>
  ) : null;

export default MarkdownField;
