import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '../../theme/tokens';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            Memora encountered an unexpected error. Please try again.
          </Text>
          <Pressable accessibilityRole="button" onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: brand.green,
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: brand.butter,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: brand.butterMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    textAlign: 'center',
  },
  button: {
    backgroundColor: brand.butter,
    borderRadius: 18,
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  buttonText: {
    color: brand.green,
    fontSize: 16,
    fontWeight: '600',
  },
});
