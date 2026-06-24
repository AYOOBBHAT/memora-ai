import { useCallback, useRef } from 'react';
import { type TextInputProps, type View } from 'react-native';

import { useKeyboardScroll } from './KeyboardScrollContext';

export function useInputScrollOnFocus() {
  const fieldRef = useRef<View>(null);
  const scrollContext = useKeyboardScroll();

  const createFocusHandler = useCallback(
    (existingOnFocus?: TextInputProps['onFocus']): TextInputProps['onFocus'] =>
      (event) => {
        existingOnFocus?.(event);

        if (!scrollContext || !fieldRef.current) {
          return;
        }

        requestAnimationFrame(() => {
          fieldRef.current?.measureInWindow((_x, y, _width, height) => {
            scrollContext.registerFocusedInput(y, height);
            scrollContext.scrollToInput(y, height);
          });
        });
      },
    [scrollContext],
  );

  return { fieldRef, createFocusHandler };
}
