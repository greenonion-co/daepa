import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  Animated,
  Text,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GuestTabParamList, MemberTabParamList } from '@/types/navigation';
import {
  Home,
  LogIn,
  PawPrint,
  Egg,
  HeartHandshake,
  Gem,
} from 'lucide-react-native';
import WebViewScreen from '../screens/WebView';
import LoginScreen from '../screens/Login';
import { useThemeStore, themeColors } from '@/store/theme';
import { useNavigationStore } from '@/store/navigation';
import useAuth, { useUser } from '@/hooks/useAuth';

const GuestTab = createBottomTabNavigator<GuestTabParamList>();
const MemberTab = createBottomTabNavigator<MemberTabParamList>();

const TAB_ICON_SIZE = 24;

// 애니메이션 탭 아이콘 생성 함수
const createAnimatedTabIcon = (
  IconComponent: React.FC<{ size: number; color: string }>,
  label: string,
) => {
  return ({ color }: { focused: boolean; color: string }) => {
    return (
      <View style={styles.tabIconContainer}>
        <IconComponent size={TAB_ICON_SIZE} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </View>
    );
  };
};

// 애니메이션 탭 버튼 (누르는 효과)
const AnimatedTabButton = (props: BottomTabBarButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const { onPress, onLongPress, style, children } = props;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, styles.tabButton]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// 탭 아이콘들
const FeedTabIcon = createAnimatedTabIcon(Home, '피드');
const LoginTabIcon = createAnimatedTabIcon(LogIn, '로그인');
const PetsTabIcon = createAnimatedTabIcon(PawPrint, '개체룸');
const BreedingTabIcon = createAnimatedTabIcon(Egg, '브리딩룸');
const AdoptionTabIcon = createAnimatedTabIcon(HeartHandshake, '분양룸');
const ShowroomTabIcon = createAnimatedTabIcon(Gem, '쇼룸');

// WebView 래퍼 컴포넌트들
function FeedWebView() {
  return <WebViewScreen initialPath="/" />;
}

function PetsWebView() {
  return <WebViewScreen initialPath="/pet" />;
}

function BreedingWebView() {
  return <WebViewScreen initialPath="/hatching" />;
}

function AdoptionWebView() {
  return <WebViewScreen initialPath="/adoption" />;
}

function ShowroomWebView() {
  const user = useUser();
  const path =
    (user as any)?.showroomSlug ? `/@${(user as any).showroomSlug}` : '/@';
  return <WebViewScreen initialPath={path} />;
}

// 비로그인 탭 (피드 / (+) / 로그인)
function GuestTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <GuestTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.tabBar,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.tabBarBorder,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 20,
          height: tabBarHeight,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <GuestTab.Screen
        name="Feed"
        component={FeedWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: FeedTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Feed');
            }
          },
        })}
      />
      <GuestTab.Screen
        name="Settings"
        component={LoginScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: LoginTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
      />
    </GuestTab.Navigator>
  );
}

// 로그인 사용자 탭 (피드 / 개체룸 / 브리딩룸 / 분양룸 / 쇼룸)
function MemberTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <MemberTab.Navigator
      initialRouteName="Pets"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.tabBar,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.tabBarBorder,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 20,
          height: tabBarHeight,
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6',
        },
      }}
    >
      <MemberTab.Screen
        name="Feed"
        component={FeedWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: FeedTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Feed');
            }
          },
        })}
      />
      <MemberTab.Screen
        name="Pets"
        component={PetsWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: PetsTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Pets');
            }
          },
        })}
      />
      <MemberTab.Screen
        name="Breeding"
        component={BreedingWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: BreedingTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Breeding');
            }
          },
        })}
      />
      <MemberTab.Screen
        name="Adoption"
        component={AdoptionWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AdoptionTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Adoption');
            }
          },
        })}
      />
      <MemberTab.Screen
        name="Showroom"
        component={ShowroomWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ShowroomTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Showroom');
            }
          },
        })}
      />
    </MemberTab.Navigator>
  );
}

export default function Tabs() {
  const { isLoggedIn } = useAuth();
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />
      {isLoggedIn ? <MemberTabs /> : <GuestTabs />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
