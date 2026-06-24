import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeDocument } from '../../api/types';
import { PdfUploadButton } from '../../features/documents/components/PdfUploadButton';
import { UrlImportButton } from '../../features/documents/components/UrlImportButton';
import { YoutubeImportButton } from '../../features/documents/components/YoutubeImportButton';
import { useTheme } from '../../theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type QuickActionId = 'pdf' | 'url' | 'youtube' | 'note';

interface QuickActionConfig {
  id: QuickActionId;
  label: string;
  description: string;
  icon: IoniconName;
}

const ACTIONS: QuickActionConfig[] = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Chat with documents',
    icon: 'document-text-outline',
  },
  {
    id: 'url',
    label: 'Website',
    description: 'Save articles',
    icon: 'globe-outline',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Import transcripts',
    icon: 'logo-youtube',
  },
  {
    id: 'note',
    label: 'Add Note',
    description: 'Capture ideas instantly',
    icon: 'create-outline',
  },
];

interface QuickActionsSectionProps {
  onNotePress: () => void;
  onImportSuccess: (document: SafeDocument) => void;
}

export function QuickActionsSection({ onNotePress, onImportSuccess }: QuickActionsSectionProps) {
  const { theme } = useTheme();
  const [activeAction, setActiveAction] = useState<QuickActionId | null>(null);

  const handleActionPress = (actionId: QuickActionId) => {
    if (actionId === 'note') {
      onNotePress();
      return;
    }

    setActiveAction((current) => (current === actionId ? null : actionId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {ACTIONS.map((action) => {
          const isActive = activeAction === action.id;

          return (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => handleActionPress(action.id)}
              style={({ pressed }) => [
                styles.tile,
                {
                  backgroundColor: isActive ? theme.colors.surfaceElevated : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radii.lg,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.md,
                  },
                ]}
              >
                <Ionicons color={theme.colors.icon} name={action.icon} size={22} />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                {action.label}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.description,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSizes.xs,
                  },
                ]}
              >
                {action.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeAction === 'pdf' ? (
        <View style={styles.panel}>
          <PdfUploadButton onSuccess={onImportSuccess} variant="primary" />
        </View>
      ) : null}

      {activeAction === 'url' ? (
        <View style={styles.panel}>
          <UrlImportButton onSuccess={onImportSuccess} variant="primary" />
        </View>
      ) : null}

      {activeAction === 'youtube' ? (
        <View style={styles.panel}>
          <YoutubeImportButton onSuccess={onImportSuccess} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 8,
    minHeight: 120,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    lineHeight: 20,
  },
  description: {
    lineHeight: 18,
  },
  panel: {
    marginTop: 4,
  },
});
