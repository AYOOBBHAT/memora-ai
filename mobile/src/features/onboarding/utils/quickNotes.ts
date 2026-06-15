import * as collectionsService from '../../../api/services/collections.service';
import { DEFAULT_COLLECTION_COLOR } from '../../collections/constants';
import { QUICK_NOTES_COLLECTION_NAME } from '../constants';

export async function ensureQuickNotesCollection(): Promise<string> {
  const collections = await collectionsService.getCollections();
  const existing = collections.find(
    (collection) => collection.name.toLowerCase() === QUICK_NOTES_COLLECTION_NAME.toLowerCase(),
  );

  if (existing) {
    return existing.id;
  }

  const created = await collectionsService.createCollection({
    name: QUICK_NOTES_COLLECTION_NAME,
    description: 'Quick captures and onboarding notes',
    color: DEFAULT_COLLECTION_COLOR,
    icon: '📝',
  });

  return created.id;
}

export async function findQuickNotesCollectionId(): Promise<string | null> {
  const collections = await collectionsService.getCollections();
  const existing = collections.find(
    (collection) => collection.name.toLowerCase() === QUICK_NOTES_COLLECTION_NAME.toLowerCase(),
  );
  return existing?.id ?? null;
}
