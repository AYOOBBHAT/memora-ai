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

const EDITORIAL_ACCENT = brand.butter;
const EDITORIAL_BG = brand.butterSubtle;

const VISUALS: Record<DocumentSourceType, DocumentVisual> = {
  pdf: {
    icon: 'document-text-outline',
    label: 'PDF',
    accent: EDITORIAL_ACCENT,
    background: EDITORIAL_BG,
  },
  url: {
    icon: 'globe-outline',
    label: 'Website',
    accent: EDITORIAL_ACCENT,
    background: EDITORIAL_BG,
  },
  youtube: {
    icon: 'logo-youtube',
    label: 'YouTube',
    accent: EDITORIAL_ACCENT,
    background: EDITORIAL_BG,
  },
  text: {
    icon: 'reader-outline',
    label: 'Note',
    accent: EDITORIAL_ACCENT,
    background: EDITORIAL_BG,
  },
  upload: {
    icon: 'cloud-upload-outline',
    label: 'Upload',
    accent: EDITORIAL_ACCENT,
    background: EDITORIAL_BG,
  },
};

export function getDocumentVisual(sourceType: DocumentSourceType): DocumentVisual {
  return VISUALS[sourceType] ?? VISUALS.text;
}
