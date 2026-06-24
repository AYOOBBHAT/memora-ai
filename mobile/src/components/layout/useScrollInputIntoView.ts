import { useCallback, type RefObject } from 'react';
import { Keyboard, type TextInputProps, type View } from 'react-native';

import { useKeyboardScroll } from './KeyboardScrollContext';

export function useScrollInputIntoView(
  containerRef: RefObject<View | null>,
): NonNullable<TextInputProps['onFocus']> {
  const scrollContext = useKeyboardScroll();

  return useCallback(() => {
    if (!scrollContext || !containerRef.current) {
      return;
    }

    containerRef.current.measureInWindow((_x, y, _width, height) => {
      scrollContext.registerFocusedInput(y, height);
      scrollContext.scrollToInput(y, height);
    });
  }, [containerRef, scrollContext]);
}

export function dismissKeyboard(): void {
  Keyboard.dismiss();
}
