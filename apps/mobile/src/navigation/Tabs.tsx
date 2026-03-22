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
import HomeSvg from '@/assets/svgs/tabIcons/Home.svg';
import Profile from '@/assets/svgs/tabIcons/Profile.svg';
import Calendar from '@/assets/svgs/tabIcons/Calendar.svg';
import Chart from '@/assets/svgs/tabIcons/Chart.svg';
import Category from '@/assets/svgs/tabIcons/Category.svg';
import WebViewScreen from '../screens/WebView';
import LoginScreen from '../screens/Login';
import AddPetButton from '../components/common/AddPetButton';
import { GeneralTabParamList, AdminTabParamList } from '@/types/navigation';
import { useThemeStore, themeColors } from '@/store/theme';
import { useNavigationStore } from '@/store/navigation';
import useAuth, { useUser } from '@/hooks/useAuth';

const GeneralTab = createBottomTabNavigator<GeneralTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

const TAB_ICON_SIZE = 24;

// 애니메이션 탭 아이콘 생성 함수
const createAnimatedTabIcon = (
  IconComponent: React.FC<{
    width: number;
    height: number;
    fill: string;
  }>,
  label: string,
) => {
  return ({ color }: { focused: boolean; color: string }) => {
    return (
      <View style={styles.tabIconContainer}>
        <IconComponent
          width={TAB_ICON_SIZE}
          height={TAB_ICON_SIZE}
          fill={color}
        />
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
const HomeTabIcon = createAnimatedTabIcon(HomeSvg, '홈');
const LoginTabIcon = createAnimatedTabIcon(Profile, '로그인');
const PetListTabIcon = createAnimatedTabIcon(HomeSvg, '개체룸');
const EggTabIcon = createAnimatedTabIcon(Calendar, '브리딩룸');
const HeartTabIcon = createAnimatedTabIcon(Chart, '분양룸');
const ShowroomTabIcon = createAnimatedTabIcon(Category, '쇼룸');

// 빈 컴포넌트 (+ 버튼용, 실제로 렌더링되지 않음)
function EmptyScreen() {
  return null;
}

// WebView 래퍼 컴포넌트들
function HomeWebView() {
  return <WebViewScreen initialPath="/" />;
}

function PetListWebView() {
  return <WebViewScreen initialPath="/pet" />;
}

function HatchingWebView() {
  return <WebViewScreen initialPath="/hatching" />;
}

function AdoptionWebView() {
  return <WebViewScreen initialPath="/adoption" />;
}

function ShowroomWebView() {
  const user = useUser();
  const path = user?.name ? `/@${encodeURIComponent(user.name)}` : '/@';
  return <WebViewScreen initialPath={path} />;
}

// 비로그인 탭 (홈 / (+) / 로그인)
function GuestTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <GeneralTab.Navigator
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
      <GeneralTab.Screen
        name="Home"
        component={HomeWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: HomeTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Home');
            }
          },
        })}
      />
      <GeneralTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: AddPetButton,
        }}
      />
      <GeneralTab.Screen
        name="Settings"
        component={LoginScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: LoginTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
      />
    </GeneralTab.Navigator>
  );
}

// 로그인 탭 (개체룸 / 브리딩룸 / (+) / 분양룸 / 쇼룸)
function MemberTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <AdminTab.Navigator
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
      <AdminTab.Screen
        name="Home"
        component={PetListWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: PetListTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Home');
            }
          },
        })}
      />
      <AdminTab.Screen
        name="Hatching"
        component={HatchingWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: EggTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Hatching');
            }
          },
        })}
      />
      <AdminTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: AddPetButton,
        }}
      />
      <AdminTab.Screen
        name="Adoption"
        component={AdoptionWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: HeartTabIcon,
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
      <AdminTab.Screen
        name="Settings"
        component={ShowroomWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ShowroomTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('Settings');
            }
          },
        })}
      />
    </AdminTab.Navigator>
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
