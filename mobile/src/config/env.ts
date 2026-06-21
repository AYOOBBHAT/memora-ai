function requireEnv(name: string, value: string | undefined): string {

  if (!value || value.trim() === '') {

    throw new Error(`${name} is required. Copy .env.example to .env and set a value.`);

  }

  return value.trim().replace(/\/$/, '');

}



function optionalEnv(value: string | undefined): string {

  return value?.trim() ?? '';

}



export const env = {

  apiUrl: requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),

  googleWebClientId: optionalEnv(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),

  privacyPolicyUrl: optionalEnv(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL),

  termsOfServiceUrl: optionalEnv(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL),

  playStoreUrl: optionalEnv(process.env.EXPO_PUBLIC_PLAY_STORE_URL),

  supportEmail: optionalEnv(process.env.EXPO_PUBLIC_SUPPORT_EMAIL) || 'dbmemora@gmail.com',

} as const;

