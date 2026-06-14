import { useQuery } from '@tanstack/react-query';

import * as documentsService from '../../api/services/documents.service';
import { queryKeys } from '../../lib/queryClient';
import { useAuthStore } from '../../stores/auth.store';

export function useDocuments() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.documents.list(),
    queryFn: documentsService.getDocuments,
    enabled: isAuthenticated,
  });
}

export function useDocument(documentId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => documentsService.getDocument(documentId),
    enabled: isAuthenticated && Boolean(documentId),
  });
}
