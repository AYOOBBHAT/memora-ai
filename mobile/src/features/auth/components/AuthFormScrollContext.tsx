import { createContext, useContext } from 'react';

export type AuthFormScrollContextValue = {
  scrollToInput: (inputY: number, inputHeight: number) => void;
};

export const AuthFormScrollContext = createContext<AuthFormScrollContextValue | null>(null);

export function useAuthFormScroll(): AuthFormScrollContextValue | null {
  return useContext(AuthFormScrollContext);
}
