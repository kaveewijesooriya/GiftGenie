import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type AppearanceChoice = 'light' | 'dark' | 'system';
type AppearanceContextValue = { choice: AppearanceChoice; isDark: boolean; setChoice: (choice: AppearanceChoice) => Promise<void>; currency: string; setCurrency: (currency: string) => Promise<void>; notificationsEnabled: boolean; setNotificationsEnabled: (enabled: boolean) => Promise<void>; ready: boolean };
const STORAGE_KEY = '@giftgenie_appearance';
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoiceState] = useState<AppearanceChoice>('system');
  const [currency, setCurrencyState] = useState('LKR');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem('@giftgenie_currency'), AsyncStorage.getItem('@giftgenie_notifications')]).then(([appearance, savedCurrency, savedNotifications]) => {
      if (!active) return;
      if (appearance === 'light' || appearance === 'dark' || appearance === 'system') setChoiceState(appearance);
      if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) setCurrencyState(savedCurrency);
      if (savedNotifications === 'true' || savedNotifications === 'false') setNotificationsEnabledState(savedNotifications === 'true');
    }).catch((error: unknown) => console.warn('Could not load app preferences:', error))
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const setChoice = useCallback(async (value: AppearanceChoice) => {
    setChoiceState(value);
    try { await AsyncStorage.setItem(STORAGE_KEY, value); }
    catch (error) { console.warn('Could not save appearance preference:', error); }
  }, []);
  const setCurrency = useCallback(async (value: string) => {
    if (!/^[A-Z]{3}$/.test(value)) return;
    setCurrencyState(value);
    try { await AsyncStorage.setItem('@giftgenie_currency', value); }
    catch (error) { console.warn('Could not save currency preference:', error); }
  }, []);
  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    setNotificationsEnabledState(value);
    try { await AsyncStorage.setItem('@giftgenie_notifications', String(value)); }
    catch (error) { console.warn('Could not save notification preference:', error); }
  }, []);
  const value = useMemo(() => ({ choice, isDark: choice === 'dark' || (choice === 'system' && system === 'dark'), setChoice, currency, setCurrency, notificationsEnabled, setNotificationsEnabled, ready }), [choice, system, setChoice, currency, setCurrency, notificationsEnabled, setNotificationsEnabled, ready]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}
