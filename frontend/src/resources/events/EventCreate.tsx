import { useEffect } from 'react';
import { useForm } from '@refinedev/antd';
import { useSearchParams } from 'react-router';
import { CreateSide } from '../../layout/SidePanels';
import EventForm from './EventForm';

const EventCreate = () => {
  const [searchParams] = useSearchParams();
  const startTime = searchParams.get('startTime') ?? undefined;
  const concerns = searchParams.get('concerns') ?? undefined;
  const { formProps, saveButtonProps } = useForm({ redirect: 'show' });

  // The panel stays open when another day is clicked in the calendar
  useEffect(() => {
    if (startTime) formProps.form?.setFieldValue('startTime', startTime);
  }, [startTime, formProps.form]);

  return (
    <CreateSide title="Nouvel événement" saveButtonProps={saveButtonProps}>
      <EventForm {...formProps} initialValues={{ startTime, 'pair:concerns': concerns }} />
    </CreateSide>
  );
};

export default EventCreate;
