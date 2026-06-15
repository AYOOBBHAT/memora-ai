import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_STORAGE_KEYS } from './constants';

export async function getOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.completed);
  return value === 'true';
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.completed, completed ? 'true' : 'false');
}

export async function getKnowledgeCategory(): Promise<string | null> {
  return AsyncStorage.getItem(ONBOARDING_STORAGE_KEYS.knowledgeCategory);
}

export async function setKnowledgeCategory(categoryId: string): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEYS.knowledgeCategory, categoryId);
}
