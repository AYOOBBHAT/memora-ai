import { createContext, useContext } from 'react';

export type KeyboardScrollContextValue = {
  scrollToInput: (inputY: number, inputHeight: number) => void;
  registerFocusedInput: (inputY: number, inputHeight: number) => void;
};

export const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

export function useKeyboardScroll(): KeyboardScrollContextValue | null {
  return useContext(KeyboardScrollContext);
}
