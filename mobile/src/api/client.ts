import axios from 'axios';

import { env } from '../config/env';
import { API_VERSION_PATH } from '../lib/constants';

export const apiClient = axios.create({
  baseURL: `${env.apiUrl}${API_VERSION_PATH}`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
