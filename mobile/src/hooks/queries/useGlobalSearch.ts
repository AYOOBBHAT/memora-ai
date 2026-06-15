import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import * as searchService from '../../api/services/search.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useGlobalSearch(query: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const isEnabled = isAuthenticated && debouncedQuery.length >= MIN_QUERY_LENGTH;

  return useQuery({
    queryKey: queryKeys.search.query(debouncedQuery),
    queryFn: () => searchService.globalSearch(debouncedQuery),
    enabled: isEnabled,
  });
}

export { MIN_QUERY_LENGTH, DEBOUNCE_MS };
