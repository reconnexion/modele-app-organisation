import { useEffect, useMemo } from 'react';
import { CreateButton, useForm } from '@refinedev/antd';
import { useCan, useNavigation, useResourceParams, useShow } from '@refinedev/core';
import { Descriptions, Empty, Grid, Space, Spin } from 'antd';
import { useSearchParams } from 'react-router';
import { arrayOf } from '@activitypods/refine-providers';
import MarkdownField from '../../common/MarkdownField';
import { CreateSide, EditSide, ShowSide } from '../../layout/SidePanels';
import CircleForm from './CircleForm';
import CirclePacking, { type Circle } from './CirclePacking';
import { CircleTags, useCircles } from './common';
import UpcomingMeetings from '../events/UpcomingMeetings';

export const CircleList = () => {
  const { circles, isLoading } = useCircles();
  const { id, action } = useResourceParams();
  const { show, list } = useNavigation();
  const screens = Grid.useBreakpoint();

  const roots = circles.filter(circle => !circles.some(parent => parent.id === circle['pair:partOf']));
  const mainCircleId = roots.length === 1 ? roots[0].id : undefined;

  // As in OrganiGraph, the main circle is shown when nothing is selected (on mobile, the panel would hide the circles)
  useEffect(() => {
    if (action === 'list' && screens.md && mainCircleId) show('circles', mainCircleId, 'replace');
  }, [action, screens.md, mainCircleId, show]);

  if (!isLoading && circles.length === 0) return <Empty description="Aucun cercle pour l'instant" />;

  return (
    <Spin spinning={isLoading}>
      <div style={{ height: 'calc(100dvh - 160px)', minHeight: 300 }}>
        {circles.length > 0 && (
          <CirclePacking
            circles={circles}
            selectedId={id?.toString()}
            onSelect={circleId => (circleId ? show('circles', circleId) : list('circles'))}
          />
        )}
      </div>
    </Spin>
  );
};

export const CircleShow = () => {
  const { result: record, query } = useShow<Circle & Record<string, any>>();
  const { circles } = useCircles();
  const parent = circles.find(circle => circle.id === record?.['pair:partOf']);
  const subCircles = useMemo(
    () => circles.filter(circle => record && circle['pair:partOf'] === record.id),
    [circles, record]
  );
  const homePages = arrayOf<string>(record?.['pair:homePage']);
  const { data: canCreate } = useCan({ resource: 'circles', action: 'create' });

  return (
    <ShowSide isLoading={query.isLoading} title={record?.['pair:label']}>
      <Descriptions column={1} layout="vertical" colon={false}>
        {record?.['hc:purpose'] && (
          <Descriptions.Item label="Raison d'être">
            <MarkdownField value={record['hc:purpose']} />
          </Descriptions.Item>
        )}
        {record?.['hc:accountabilities'] && (
          <Descriptions.Item label="Redevabilités">
            <MarkdownField value={record['hc:accountabilities']} />
          </Descriptions.Item>
        )}
        {record?.['hc:domain'] && <Descriptions.Item label="Domaine">{record['hc:domain']}</Descriptions.Item>}
        {homePages.length > 0 && (
          <Descriptions.Item label="Canaux de communication">
            <Space direction="vertical" size={0}>
              {homePages.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              ))}
            </Space>
          </Descriptions.Item>
        )}
        {parent && (
          <Descriptions.Item label="Fait partie de">
            <CircleTags circles={[parent]} />
          </Descriptions.Item>
        )}
        {record && (subCircles.length > 0 || canCreate?.can) && (
          <Descriptions.Item label="Sous-cercles">
            <Space wrap>
              <CircleTags circles={subCircles} />
              <CreateButton resource="circles" size="small" meta={{ query: { partOf: record.id } }}>
                Ajouter un sous-cercle
              </CreateButton>
            </Space>
          </Descriptions.Item>
        )}
        {record && (
          <Descriptions.Item label="Prochaines réunions">
            <UpcomingMeetings circleId={record.id} />
          </Descriptions.Item>
        )}
      </Descriptions>
    </ShowSide>
  );
};

export const CircleCreate = () => {
  const [searchParams] = useSearchParams();
  const partOf = searchParams.get('partOf') ?? undefined;
  const { formProps, saveButtonProps } = useForm({ redirect: 'show' });

  useEffect(() => {
    formProps.form?.setFieldValue('pair:partOf', partOf);
  }, [partOf, formProps.form]);

  return (
    <CreateSide title="Nouveau cercle" saveButtonProps={saveButtonProps}>
      <CircleForm {...formProps} initialValues={{ 'pair:partOf': partOf }} />
    </CreateSide>
  );
};

export const CircleEdit = () => {
  const { id } = useResourceParams();
  const { formProps, saveButtonProps, query } = useForm({ redirect: 'show' });
  return (
    <EditSide title="Modifier le cercle" saveButtonProps={saveButtonProps} isLoading={query?.isLoading}>
      <CircleForm {...formProps} circleId={id?.toString()} />
    </EditSide>
  );
};
