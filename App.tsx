/**
 * App.tsx — Root component
 *
 * Provider stack (outermost → innermost):
 *   SafeAreaProvider         — safe area insets on all screens
 *   GestureHandlerRootView   — required by React Navigation / Reanimated
 *   PersistGate              — delays render until MMKV rehydration is done
 *   Provider (Redux)         — global state
 *   AppNavigator             — screens + navigation
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { Loader } from './src/components';
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<Loader fullScreen />} persistor={persistor}>
            <ThemeProvider>
              <AppNavigator />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
