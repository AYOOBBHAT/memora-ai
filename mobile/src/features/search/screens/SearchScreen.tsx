import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorBanner } from '../../collections/components/ErrorBanner';
import { HighlightedText } from '../components/HighlightedText';
import { MIN_QUERY_LENGTH, useGlobalSearch } from '../../../hooks/queries/useGlobalSearch';
import { getApiErrorMessage } from '../../../lib/apiError';
import type { GlobalSearchResult } from '../../../api/types';
import type { DocumentsStackParamList, MainTabParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';

type SearchNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DocumentsStackParamList, 'Search'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type Props = NativeStackScreenProps<DocumentsStackParamList, 'Search'>;

type ListItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'result'; id: string; result: GlobalSearchResult };

export function SearchScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const { data, isFetching, isError, error, refetch } = useGlobalSearch(query);

  const tabNavigation = navigation.getParent<SearchNavigationProp>();

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const handleDocumentPress = useCallback(
    (documentId: string) => {
      navigation.navigate('DocumentDetail', { documentId });
    },
    [navigation],
  );

  const handleCollectionPress = useCallback(
    (collectionId: string) => {
      tabNavigation?.navigate('Collections', {
        screen: 'CollectionDetail',
        params: { collectionId },
      });
    },
    [tabNavigation],
  );

  const listItems = useMemo((): ListItem[] => {
    if (!data?.results.length) {
      return [];
    }

    const documents = data.results.filter((item) => item.type === 'document');
    const collections = data.results.filter((item) => item.type === 'collection');
    const items: ListItem[] = [];

    if (documents.length > 0) {
      items.push({ kind: 'header', id: 'header-documents', title: 'Documents' });
      documents.forEach((result) => {
        items.push({ kind: 'result', id: `document-${result.id}`, result });
      });
    }

    if (collections.length > 0) {
      items.push({ kind: 'header', id: 'header-collections', title: 'Collections' });
      collections.forEach((result) => {
        items.push({ kind: 'result', id: `collection-${result.id}`, result });
      });
    }

    return items;
  }, [data?.results]);

  const showHint = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showInitialState = trimmedQuery.length === 0;
  const showNoResults =
    trimmedQuery.length >= MIN_QUERY_LENGTH && !isFetching && !isError && listItems.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <Text
            style={[
              styles.sectionHeader,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            {item.title}
          </Text>
        );
      }

      const { result } = item;
      const activeQuery = data?.query ?? trimmedQuery;

      if (result.type === 'document') {
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => handleDocumentPress(result.id)}
            style={({ pressed }) => [
              styles.resultCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <HighlightedText
                text={result.title}
                query={activeQuery}
                numberOfLines={1}
                style={[
                  styles.resultTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSizes.md,
                    fontWeight: theme.typography.fontWeights.semibold,
                  },
                ]}
              />
              <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
                  {result.sourceType}
                </Text>
              </View>
            </View>
            <HighlightedText
              text={result.snippet}
              query={activeQuery}
              numberOfLines={2}
              style={[
                styles.resultSnippet,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSizes.sm,
                },
              ]}
            />
          </Pressable>
        );
      }

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => handleCollectionPress(result.id)}
          style={({ pressed }) => [
            styles.resultCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.resultHeader}>
            <HighlightedText
              text={result.name}
              query={activeQuery}
              numberOfLines={1}
              style={[
                styles.resultTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSizes.md,
                  fontWeight: theme.typography.fontWeights.semibold,
                },
              ]}
            />
            <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
                collection
              </Text>
            </View>
          </View>
          <HighlightedText
            text={result.snippet}
            query={activeQuery}
            numberOfLines={2}
            style={[
              styles.resultSnippet,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.sm,
              },
            ]}
          />
        </Pressable>
      );
    },
    [
      data?.query,
      handleCollectionPress,
      handleDocumentPress,
      theme.colors,
      theme.typography,
      trimmedQuery,
    ],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.searchBar,
          {
            paddingTop: insets.top > 0 ? 8 : 16,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            accessibilityLabel="Search documents and collections"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="never"
            placeholder="Search documents and collections"
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="search"
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.md,
              },
            ]}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={handleClear}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
          </View>
        </View>
        {isFetching && trimmedQuery.length >= MIN_QUERY_LENGTH ? (
          <ActivityIndicator color={theme.colors.primary} size="small" style={styles.loader} />
        ) : null}
      </View>

      {isError ? (
        <View style={styles.padded}>
          <ErrorBanner
            message={getApiErrorMessage(error, 'Search failed')}
            onRetry={() => void refetch()}
          />
        </View>
      ) : null}

      {showInitialState ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.lg,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            Search documents and collections
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.md,
              },
            ]}
          >
            Enter at least {MIN_QUERY_LENGTH} characters to search titles, content, and collection
            names.
          </Text>
        </View>
      ) : null}

      {showHint ? (
        <View style={styles.centered}>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSizes.md,
              },
            ]}
          >
            Type at least {MIN_QUERY_LENGTH} characters to search.
          </Text>
        </View>
      ) : null}

      {showNoResults ? (
        <View style={styles.centered}>
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSizes.lg,
                fontWeight: theme.typography.fontWeights.semibold,
              },
            ]}
          >
            {`No matches for '${data?.query ?? trimmedQuery}'`}
          </Text>
        </View>
      ) : null}

      {listItems.length > 0 ? (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
          data={listItems}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  loader: {
    marginTop: 12,
  },
  padded: {
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
  },
  resultSnippet: {
    lineHeight: 20,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
