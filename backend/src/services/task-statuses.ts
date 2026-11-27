import { Errors, type ServiceSchema } from 'moleculer';
import StorageMixin, { arrayOf } from '../mixins/storage.ts';

const TASK_STATUS_SHAPE_TREE = 'https://shapes.activitypods.org/shapetrees/pair/TaskStatus';

// Created in this order, which is the one shown to users
const DEFAULT_TASK_STATUSES = [
  { fr: 'En attente', en: 'Waiting' },
  { fr: 'Prêt à démarrer', en: 'Ready' },
  { fr: 'En cours', en: 'In progress' },
  { fr: 'Fait', en: 'Done' }
];

const TaskStatusesService: ServiceSchema = {
  name: 'task-statuses',
  mixins: [StorageMixin],
  actions: {
    // Statuses already there (e.g. an existing data space) are kept
    async createDefaults(ctx) {
      const { storageWebId } = ctx.params;
      const containerUri = await this.getContainerUri(ctx, storageWebId, TASK_STATUS_SHAPE_TREE);
      if (!containerUri)
        throw new Errors.MoleculerServerError('No container for the task statuses', 500, 'NO_CONTAINER');

      const container = await this.getJson(ctx, containerUri);
      if (arrayOf(container['ldp:contains']).length > 0) return;

      for (const labels of DEFAULT_TASK_STATUSES) {
        const { ok, status }: any = await ctx.call('agent.fetch', {
          url: containerUri,
          method: 'POST',
          headers: { 'Content-Type': 'application/ld+json' },
          body: {
            '@context': { pair: 'http://virtual-assembly.org/ontologies/pair#' },
            '@type': 'pair:TaskStatus',
            'pair:label': Object.entries(labels).map(([language, value]) => ({
              '@value': value,
              '@language': language
            }))
          }
        });
        if (!ok)
          throw new Errors.MoleculerServerError(`Could not create a task status (${status})`, 500, 'CREATE_FAILED');
      }
      this.logger.info(`Default task statuses created in ${containerUri}`);
    }
  }
};

export default TaskStatusesService;
