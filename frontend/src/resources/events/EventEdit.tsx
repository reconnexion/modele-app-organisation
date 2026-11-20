import { Edit, useForm } from '@refinedev/antd';
import EventForm from './EventForm';

const EventEdit = () => {
  const { formProps, saveButtonProps, query } = useForm({ redirect: 'show' });
  return (
    <Edit title="Modifier l'événement" saveButtonProps={saveButtonProps} isLoading={query?.isLoading}>
      <EventForm {...formProps} />
    </Edit>
  );
};

export default EventEdit;
