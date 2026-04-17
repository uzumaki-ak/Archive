/**
 * App Navigator — Liquid Glass Edition
 *
 * Structure:
 *   RootStack (Native Stack)
 *   └── MainTabs (Bottom Tabs) with Liquid Glass Tab Bar
 *       ├── HomeScreen
 *       ├── SearchScreen
 *       └── SavedScreen
 *   └── DetailScreen
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import DetailScreen from '../screens/DetailScreen';
import SavedScreen from '../screens/SavedScreen';

import { Typography, useTheme } from '../theme';
import type { RootStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 3;
const TAB_BAR_MARGIN = 24;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const PILL_WIDTH = TAB_WIDTH - 16;
const PILL_INSET = 8;

// Spring config for liquid feel
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.8,
};

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TAB_ITEMS = [
  { key: 'Home', label: 'Archive', icon: 'grid' },
  { key: 'Search', label: 'Search', icon: 'search' },
  { key: 'Saved', label: 'Library', icon: 'bookmark' },
] as const;

// ─── Liquid Tab Bar ───────────────────────────────────────────────────────────

function LiquidTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const translateX = useSharedValue(state.index * TAB_WIDTH + PILL_INSET);

  // Update pill position when tab changes
  React.useEffect(() => {
    translateX.value = withSpring(
      state.index * TAB_WIDTH + PILL_INSET,
      SPRING_CONFIG,
    );
  }, [state.index, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={tabBarStyles.outerWrap}>
      <View style={[tabBarStyles.glass, { backgroundColor: colors.tabBar, borderColor: colors.tabBarBorder }]}>
        {/* Liquid pill indicator */}
        <Animated.View style={[tabBarStyles.pill, pillStyle, { backgroundColor: colors.pill }]} />

        {/* Tab items */}
        <View style={tabBarStyles.tabRow}>
          {TAB_ITEMS.map((tab, index) => {
            const isFocused = state.index === index;

            const handlePress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[index].key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(state.routes[index].name);
              }
            };

            return (
              <LiquidTabItem
                key={tab.key}
                label={tab.label}
                iconName={tab.icon}
                isFocused={isFocused}
                onPress={handlePress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Individual Tab Item with micro-interactions ──────────────────────────────

interface LiquidTabItemProps {
  label: string;
  iconName: string;
  isFocused: boolean;
  onPress: () => void;
}

function LiquidTabItem({ label, iconName, isFocused, onPress }: LiquidTabItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(isFocused ? 1.15 : 1);

  React.useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.15 : 1, {
      damping: 15,
      stiffness: 200,
    });
  }, [isFocused, iconScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={tabBarStyles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[tabBarStyles.tabInner, animatedContainerStyle]}>
        <Animated.View style={animatedIconStyle}>
          <Icon
            name={iconName}
            size={20}
            color={isFocused ? colors.accent : colors.textMuted}
          />
        </Animated.View>
        <Text
          style={[
            tabBarStyles.tabLabel,
            { color: isFocused ? colors.accent : colors.textMuted },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Tab Bar Styles ───────────────────────────────────────────────────────────

const tabBarStyles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
  },
  glass: {
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 6,
    left: 0,
    width: PILL_WIDTH,
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 26,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: Typography.label,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

// ─── Main Tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      sceneContainerStyle={{ backgroundColor: colors.background }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
