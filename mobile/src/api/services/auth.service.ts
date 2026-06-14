import { apiClient } from '../client';
import type { ApiResponse, MobileAuthData, SafeUser } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  idToken: string;
}

function unwrapAuthData(response: ApiResponse<MobileAuthData>): MobileAuthData {
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Authentication failed');
  }
  return response.data;
}

export async function login(input: LoginInput): Promise<MobileAuthData> {
  const { data } = await apiClient.post<ApiResponse<MobileAuthData>>('/auth/login', input);
  return unwrapAuthData(data);
}

export async function register(input: RegisterInput): Promise<MobileAuthData> {
  const { data } = await apiClient.post<ApiResponse<MobileAuthData>>('/auth/register', input);
  return unwrapAuthData(data);
}

export async function googleAuth(input: GoogleAuthInput): Promise<MobileAuthData> {
  const { data } = await apiClient.post<ApiResponse<MobileAuthData>>('/auth/google', input);
  return unwrapAuthData(data);
}

export async function logout(refreshToken?: string | null): Promise<void> {
  await apiClient.post<ApiResponse>('/auth/logout', refreshToken ? { refreshToken } : {});
}

export async function getMe(): Promise<SafeUser> {
  const { data } = await apiClient.get<ApiResponse<{ user: SafeUser }>>('/auth/me');
  if (!data.success || !data.data?.user) {
    throw new Error(data.message || 'Failed to load profile');
  }
  return data.data.user;
}
