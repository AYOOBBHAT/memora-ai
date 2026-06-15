import axios from 'axios';

import { env } from '../config/env';
import { API_VERSION_PATH } from '../lib/constants';

// TEMP DEBUG — remove after signup network issue is resolved
const resolvedBaseURL = `${env.apiUrl}${API_VERSION_PATH}`;
console.log('[API_DEBUG] apiClient init — baseURL:', resolvedBaseURL, '| env.apiUrl:', env.apiUrl);

export const apiClient = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
