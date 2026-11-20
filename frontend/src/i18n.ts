import type { I18nProvider } from '@refinedev/core';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

const messages: Record<string, any> = {
  buttons: {
    create: 'Créer',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    show: 'Voir',
    list: 'Liste',
    cancel: 'Annuler',
    confirm: 'Êtes-vous sûr ?',
    refresh: 'Actualiser',
    logout: 'Se déconnecter',
    share: 'Partager'
  },
  actions: {
    list: 'Liste',
    create: 'Créer',
    edit: 'Modifier',
    show: 'Voir'
  },
  notifications: {
    success: 'Succès',
    error: 'Erreur ({{statusCode}})',
    createSuccess: 'Créé avec succès',
    createError: 'Erreur lors de la création ({{statusCode}})',
    editSuccess: 'Modifié avec succès',
    editError: 'Erreur lors de la modification ({{statusCode}})',
    deleteSuccess: 'Supprimé avec succès',
    deleteError: 'Erreur lors de la suppression ({{statusCode}})'
  },
  pages: {
    login: {
      choosePodProvider: "Choisissez l'hébergeur de votre porte-données",
      podProvidersNotLoaded: 'Impossible de charger la liste des hébergeurs',
      backToLogin: 'Retour à la connexion'
    },
    error: {
      404: "La page que vous cherchez n'existe pas.",
      backHome: "Retour à l'accueil"
    }
  }
};

const lookup = (key: string) => key.split('.').reduce((value, part) => value?.[part], messages as any);

const interpolate = (text: string, values?: Record<string, any>) =>
  text.replace(/{{(\w+)}}/g, (_, name) => values?.[name] ?? '');

export const i18nProvider: I18nProvider = {
  // Refine passes its default (English) message either as 2nd or 3rd argument
  translate: (key: string, options?: any, defaultMessage?: string) => {
    const message = lookup(key);
    if (typeof message === 'string') return interpolate(message, typeof options === 'object' ? options : undefined);
    return typeof options === 'string' ? options : (defaultMessage ?? key);
  },
  changeLocale: async () => {},
  getLocale: () => 'fr'
};
