import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { SafeDocument } from '../../../api/types';
import { isValidYouTubeUrl } from '../../../api/services/documents.service';
import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { useImportYoutube } from '../../../hooks/mutations/useImportYoutube';
import { getApiErrorMessage } from '../../../lib/apiError';
import { useTheme } from '../../../theme/ThemeProvider';

export interface YoutubeImportButtonProps {
  collectionId?: string | null;
  title?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onSuccess?: (document: SafeDocument) => void;
}

export function YoutubeImportButton({
  collectionId,
  title,
  label = 'Import YouTube',
  variant = 'primary',
  disabled = false,
  onSuccess,
}: YoutubeImportButtonProps) {
  const { theme } = useTheme();
  const importYoutube = useImportYoutube();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState<'fetching' | 'extracting'>('fetching');

  const isImporting = importYoutube.isPending;
  const isPrimary = variant === 'primary';

  useEffect(() => {
    if (!isImporting) {
      setProgressStage('fetching');
      return;
    }

    setProgressStage('fetching');
    const timer = setTimeout(() => {
      setProgressStage('extracting');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isImporting]);

  const handleImport = useCallback(() => {
    if (isImporting) {
      return;
    }

    setLocalError(null);
    setUrlError(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setUrlError('YouTube URL is required');
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setUrlError('Enter a valid YouTube URL (youtube.com or youtu.be)');
      return;
    }

    importYoutube.mutate(
      {
        url: trimmedUrl,
        title: title?.trim() || undefined,
        collectionId: collectionId ?? undefined,
      },
      {
        onSuccess: (result) => {
          setUrl('');
          onSuccess?.(result.document);
        },
        onError: (error) => {
          setLocalError(getApiErrorMessage(error, 'Failed to import YouTube transcript'));
        },
      },
    );
  }, [collectionId, importYoutube, isImporting, onSuccess, title, url]);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: urlError ? theme.colors.error : theme.colors.border,
      color: theme.colors.text,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <TextInput
          accessibilityLabel="YouTube URL"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled && !isImporting}
          keyboardType="url"
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle}
          value={url}
          onChangeText={(value) => {
            setUrl(value);
            if (urlError) {
              setUrlError(null);
            }
          }}
        />
        {urlError ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{urlError}</Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={disabled || isImporting}
        onPress={handleImport}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceSecondary,
            borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
            opacity: disabled || isImporting ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {isImporting ? (
          <ActivityIndicator color={isPrimary ? theme.colors.primaryText : theme.colors.primary} />
        ) : (
          <Ionicons
            color={isPrimary ? theme.colors.primaryText : theme.colors.primary}
            name="logo-youtube"
            size={18}
          />
        )}
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
          {isImporting
            ? progressStage === 'fetching'
              ? 'Fetching…'
              : 'Extracting transcript…'
            : label}
        </Text>
      </Pressable>

      {isImporting ? (
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
            {progressStage === 'fetching'
              ? 'Fetching video details…'
              : 'Extracting transcript and queuing embedding…'}
          </Text>
        </View>
      ) : null}

      {localError ? <ErrorBanner message={localError} onRetry={handleImport} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldError: {
    fontSize: 13,
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
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    flex: 1,
  },
});
