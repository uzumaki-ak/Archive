import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { Book } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  Detail: { book: Book };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Saved: undefined;
};

// Root stack props
export type RootStackProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Tab props (composite so tab screens can also navigate to stack screens)
export type TabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
