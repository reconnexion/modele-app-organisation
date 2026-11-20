import { Create, useForm } from '@refinedev/antd';
import { useSearchParams } from 'react-router';
import EventForm from './EventForm';

const EventCreate = () => {
  const [searchParams] = useSearchParams();
  const { formProps, saveButtonProps } = useForm({ redirect: 'show' });
  return (
    <Create title="Nouvel événement" saveButtonProps={saveButtonProps}>
      <EventForm {...formProps} initialValues={{ startTime: searchParams.get('startTime') ?? undefined }} />
    </Create>
  );
};

export default EventCreate;
