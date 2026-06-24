/** Tonal green palette for collection accents — no rainbow colors. */
export const COLLECTION_COLORS = [
  '#013E37',
  '#024940',
  '#035049',
  '#045A52',
  '#056B62',
  '#067A70',
  '#FFEFB3',
  'rgba(255, 239, 179, 0.75)',
] as const;

export {
  COLLECTION_ICON_OPTIONS,
  COLLECTION_ICONS,
  DEFAULT_COLLECTION_ICON,
} from './utils/collectionIcon';

export const DEFAULT_COLLECTION_COLOR = COLLECTION_COLORS[0];
