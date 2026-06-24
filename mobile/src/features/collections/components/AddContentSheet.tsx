import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeDocument } from '../../../api/types';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { PdfUploadButton } from '../../documents/components/PdfUploadButton';
import { UrlImportButton } from '../../documents/components/UrlImportButton';
import { YoutubeImportButton } from '../../documents/components/YoutubeImportButton';
import { useTheme } from '../../../theme/ThemeProvider';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type AddContentFlow = 'pdf' | 'url' | 'youtube' | 'note' | 'ocr';

interface AddContentOption {
  id: AddContentFlow;
  label: string;
  description: string;
  icon: IoniconName;
}

const OPTIONS: AddContentOption[] = [
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Upload and chat with documents',
    icon: 'document-text-outline',
  },
  {
    id: 'url',
    label: 'Website',
    description: 'Save articles and pages',
    icon: 'globe-outline',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Import video transcripts',
    icon: 'logo-youtube',
  },
  {
    id: 'note',
    label: 'Note',
    description: 'Write a new note',
    icon: 'create-outline',
  },
  {
    id: 'ocr',
    label: 'Image OCR',
    description: 'Extract text from images',
    icon: 'image-outline',
  },
];

interface AddContentSheetProps {
  visible: boolean;
  collectionId: string;
  activeFlow: AddContentFlow | null;
  onClose: () => void;
  onFlowChange: (flow: AddContentFlow | null) => void;
  onCreateNote: () => void;
  onImportSuccess: (document: SafeDocument) => void;
}

export function AddContentSheet({
  visible,
  collectionId,
  activeFlow,
  onClose,
  onFlowChange,
  onCreateNote,
  onImportSuccess,
}: AddContentSheetProps) {
  const { theme } = useTheme();

  const handleClose = () => {
    onFlowChange(null);
    onClose();
  };

  const handleOptionPress = (optionId: AddContentFlow) => {
    if (optionId === 'note') {
      handleClose();
      onCreateNote();
      return;
    }

    if (optionId === 'ocr') {
      Alert.alert('Coming soon', 'Image OCR will be available in a future update.');
      return;
    }

    onFlowChange(optionId);
  };

  const handleImportSuccess = (document: SafeDocument) => {
    onFlowChange(null);
    onClose();
    onImportSuccess(document);
  };

  const flowTitle =
    activeFlow === 'pdf'
      ? 'Upload PDF'
      : activeFlow === 'url'
        ? 'Import Website'
        : activeFlow === 'youtube'
          ? 'Import YouTube'
          : 'Add Content';

  return (
    <BottomSheet
      showCloseButton={!activeFlow}
      title={activeFlow ? flowTitle : 'Add Content'}
      visible={visible}
      onClose={handleClose}
    >
      {activeFlow ? (
        <View style={styles.flowContent}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onFlowChange(null)}
            style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons color={theme.colors.text} name="chevron-back" size={18} />
            <Text
              style={[
                styles.backText,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.sm,
                  fontWeight: theme.typography.fontWeights.medium,
                },
              ]}
            >
              Back to options
            </Text>
          </Pressable>

          {activeFlow === 'pdf' ? (
            <PdfUploadButton
              collectionId={collectionId}
              label="Choose PDF file"
              variant="primary"
              onSuccess={handleImportSuccess}
            />
          ) : null}

          {activeFlow === 'url' ? (
            <UrlImportButton
              collectionId={collectionId}
              label="Import website"
              variant="primary"
              onSuccess={handleImportSuccess}
            />
          ) : null}

          {activeFlow === 'youtube' ? (
            <YoutubeImportButton
              collectionId={collectionId}
              label="Import YouTube video"
              variant="primary"
              onSuccess={handleImportSuccess}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => handleOptionPress(option.id)}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.lg,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.md,
                  },
                ]}
              >
                <Ionicons color={theme.colors.icon} name={option.icon} size={20} />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSizes.md,
                      fontWeight: theme.typography.fontWeights.semibold,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSizes.sm,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              <Ionicons color={theme.colors.textSecondary} name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
    paddingBottom: 8,
  },
  optionRow: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionIcon: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {},
  optionDescription: {
    lineHeight: 18,
  },
  flowContent: {
    gap: 12,
    paddingBottom: 8,
  },
  backRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  backText: {},
});
