import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { DocumentSourceType } from '../api/types';
import { brand } from '../theme/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface DocumentVisual {
  icon: IoniconName;
  label: string;
  accent: string;
  background: string;
}

const EDITORIAL = {
  accent: brand.textSecondary,
  background: 'transparent',
} as const;

const VISUALS: Record<DocumentSourceType, DocumentVisual> = {
  pdf: { icon: 'document-text-outline', label: 'PDF', ...EDITORIAL },
  url: { icon: 'globe-outline', label: 'Website', ...EDITORIAL },
  youtube: { icon: 'logo-youtube', label: 'YouTube', ...EDITORIAL },
  text: { icon: 'reader-outline', label: 'Note', ...EDITORIAL },
  upload: { icon: 'cloud-upload-outline', label: 'Upload', ...EDITORIAL },
};

export function getDocumentVisual(sourceType: DocumentSourceType): DocumentVisual {
  return VISUALS[sourceType] ?? VISUALS.text;
}
