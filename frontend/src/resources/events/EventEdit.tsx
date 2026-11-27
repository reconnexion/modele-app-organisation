import { useForm } from '@refinedev/antd';
import { EditSide } from '../../layout/SidePanels';
import EventForm from './EventForm';

const EventEdit = () => {
  const { formProps, saveButtonProps, query } = useForm({ redirect: 'show' });
  return (
    <EditSide title="Modifier l'événement" saveButtonProps={saveButtonProps} isLoading={query?.isLoading}>
      <EventForm {...formProps} />
    </EditSide>
  );
};

export default EventEdit;
