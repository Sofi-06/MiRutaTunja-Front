import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type Favorite = {
  id: string;
  type: 'route' | 'place';
  title: string;
  subtitle: string;
};

export type RecentSearch = { origin: string; destination: string; createdAt: number };

const favoritesKey = 'mi-ruta-tunja:favorites';
const recentKey = 'mi-ruta-tunja:recent-searches';

const read = async <T,>(key: string): Promise<T[]> => {
  try {
    const value = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(key)
      : await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const write = async <T,>(key: string, value: T[]) => {
  try {
    const serialized = JSON.stringify(value);
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, serialized);
    } else {
      await AsyncStorage.setItem(key, serialized);
    }
  } catch {
    // The app still works if local storage is unavailable.
  }
};

export const getFavorites = () => read<Favorite>(favoritesKey);
export const isFavorite = async (id: string) => (await getFavorites()).some((favorite) => favorite.id === id);
export const toggleFavorite = async (favorite: Favorite) => {
  const current = await getFavorites();
  const next = current.some((item) => item.id === favorite.id)
    ? current.filter((item) => item.id !== favorite.id)
    : [favorite, ...current];
  await write(favoritesKey, next);
  return next;
};

export const getRecentSearches = () => read<RecentSearch>(recentKey);
export const addRecentSearch = async (origin: string, destination: string) => {
  const current = await getRecentSearches();
  const next = [{ origin, destination, createdAt: Date.now() }, ...current.filter((item) => item.origin !== origin || item.destination !== destination)].slice(0, 8);
  await write(recentKey, next);
  return next;
};
