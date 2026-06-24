import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { SafeDocument } from '../../../api/types';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { useUploadPdf } from '../../../hooks/mutations/useUploadPdf';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useTheme } from '../../../theme/ThemeProvider';

interface PickedPdfFile {
  uri: string;
  name: string;
  mimeType: string;
}

/** 25 MB — validated before upload to avoid sending oversized files. */
const MAX_PDF_BYTES = 25 * 1024 * 1024;

export interface PdfUploadButtonProps {
  collectionId?: string | null;
  title?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onSuccess?: (document: SafeDocument) => void;
}

export function PdfUploadButton({
  collectionId,
  title,
  label = 'Upload PDF',
  variant = 'primary',
  disabled = false,
  onSuccess,
}: PdfUploadButtonProps) {
  const { theme } = useTheme();
  const uploadPdf = useUploadPdf();
  const [pickedFile, setPickedFile] = useState<PickedPdfFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const isUploading = uploadPdf.isPending;

  const handlePickPdf = useCallback(async () => {
    setLocalError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'application/pdf';

      if (mimeType !== 'application/pdf' && !asset.name?.toLowerCase().endsWith('.pdf')) {
        setLocalError('Only PDF files are supported');
        return;
      }

      if (typeof asset.size === 'number' && asset.size > MAX_PDF_BYTES) {
        setLocalError('PDF must be 25 MB or smaller');
        return;
      }

      setPickedFile({
        uri: asset.uri,
        name: asset.name || 'document.pdf',
        mimeType,
      });
      setUploadProgress(0);
    } catch (error) {
      setLocalError(getApiErrorMessage(error, 'Failed to pick PDF file'));
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!pickedFile || isUploading) {
      return;
    }

    setLocalError(null);
    setUploadProgress(0);

    uploadPdf.mutate(
      {
        file: {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType,
        },
        title: title?.trim() || undefined,
        collectionId: collectionId ?? undefined,
        onUploadProgress: setUploadProgress,
      },
      {
        onSuccess: (result) => {
          setPickedFile(null);
          setUploadProgress(0);
          onSuccess?.(result.document);
        },
        onError: (error) => {
          setLocalError(getApiErrorMessage(error, 'Failed to upload PDF'));
        },
      },
    );
  }, [collectionId, isUploading, onSuccess, pickedFile, title, uploadPdf]);

  const isPrimary = variant === 'primary';

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || isUploading}
        onPress={handlePickPdf}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceSecondary,
            borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
            opacity: disabled || isUploading ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          color={isPrimary ? theme.colors.primaryText : theme.colors.primary}
          name="document-text-outline"
          size={18}
        />
        <Text
          style={[
            styles.buttonText,
            {
              color: isPrimary ? theme.colors.primaryText : theme.colors.primary,
              fontSize: theme.typography.fontSizes.sm,
              fontWeight: theme.typography.fontWeights.semibold,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>

      {pickedFile ? (
        <View
          style={[
            styles.fileCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.fileName,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          >
            {pickedFile.name}
          </Text>

          {isUploading ? (
            <View style={styles.progressWrap}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${uploadProgress}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.progressText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSizes.xs,
                  },
                ]}
              >
                Uploading {uploadProgress}%
              </Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={handleUpload}
              style={({ pressed }) => [
                styles.uploadAction,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.uploadActionText,
                  {
                    color: theme.colors.primaryText,
                    fontSize: theme.typography.fontSizes.sm,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              >
                Upload and process
              </Text>
            </Pressable>
          )}

          {isUploading ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text
                style={[
                  styles.processingText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSizes.sm,
                  },
                ]}
              >
                Extracting text and queuing embedding…
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {localError ? <ErrorBanner message={localError} onRetry={pickedFile ? handleUpload : handlePickPdf} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonText: {},
  fileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  fileName: {},
  progressWrap: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {},
  uploadAction: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  uploadActionText: {},
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    flex: 1,
  },
});
