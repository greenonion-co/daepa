import React, { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import Settings from '@/assets/svgs/tabIcons/Settings.svg';
import Profile from '@/assets/svgs/tabIcons/Profile.svg';
import Calendar from '@/assets/svgs/tabIcons/Calendar.svg';
import Chart from '@/assets/svgs/tabIcons/Chart.svg';
import WebViewScreen from '../screens/WebView';
import LoginScreen from '../screens/Login';
import ModeSelectionSheet, {
  AppMode,
} from '../components/common/ModeSelectionSheet';
import AddPetButton from '../components/common/AddPetButton';
import { GeneralTabParamList, AdminTabParamList } from '@/types/navigation';
import { useUser } from '@/hooks/useAuth';
import { useThemeStore, themeColors } from '@/store/theme';
import { useNavigationStore } from '@/store/navigation';
import { UserDtoRole } from '@repo/api-client';
import useAuth from '@/hooks/useAuth';
import ModeGuideOverlay from '../components/common/ModeGuideOverlay';

const MODE_GUIDE_SHOWN_KEY = 'mode_switch_guide_shown';

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
const SettingsTabIcon = createAnimatedTabIcon(Settings, '설정');
const LoginTabIcon = createAnimatedTabIcon(Profile, '로그인');
const EggTabIcon = createAnimatedTabIcon(Calendar, '해칭룸');
const HeartTabIcon = createAnimatedTabIcon(Chart, '분양룸');
const AdminHomeTabIcon = createAnimatedTabIcon(HomeSvg, '내 펫');

// 관리자 모드용 Settings 아이콘 (뱃지 포함)
const AdminSettingsTabIcon = ({
  color,
}: {
  focused: boolean;
  color: string;
}) => {
  return (
    <View style={styles.tabIconContainer}>
      <View>
        <Settings width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} fill={color} />
        {/* 관리자 모드 뱃지 */}
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>★</Text>
        </View>
      </View>
      <Text style={[styles.tabLabel, { color }]}>설정</Text>
    </View>
  );
};

// 빈 컴포넌트 (+ 버튼용, 실제로 렌더링되지 않음)
function EmptyScreen() {
  return null;
}

// WebView 래퍼 컴포넌트들
function HomeWebView() {
  return <WebViewScreen initialPath="/" />;
}

function AdminHomeWebView() {
  return <WebViewScreen initialPath="/pet" />;
}

function HatchingWebView() {
  return <WebViewScreen initialPath="/hatching" />;
}

function AdoptionWebView() {
  return <WebViewScreen initialPath="/adoption" />;
}

function SettingsWebView() {
  return <WebViewScreen initialPath="/settings" />;
}

// 로그인 여부에 따라 다른 설정 화면 표시
function SettingsScreen() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return <SettingsWebView />;
}

interface TabsProps {
  onSettingsLongPress?: () => void;
}

// 일반 모드 탭
function GeneralTabs({ onSettingsLongPress }: TabsProps) {
  const { isLoggedIn } = useAuth();
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  // Settings 탭용 커스텀 버튼 (long-press 지원)
  const SettingsTabButton = useCallback(
    (props: BottomTabBarButtonProps) => (
      <AnimatedTabButton {...props} onLongPress={onSettingsLongPress} />
    ),
    [onSettingsLongPress],
  );

  return (
    <>
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
          component={SettingsScreen}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: isLoggedIn ? SettingsTabIcon : LoginTabIcon,
            tabBarButton: isLoggedIn ? SettingsTabButton : AnimatedTabButton,
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              if (navigation.isFocused()) {
                triggerScrollToTop('Settings');
              }
            },
          })}
        />
      </GeneralTab.Navigator>
    </>
  );
}

// 관리자 모드 탭
function AdminTabs({ onSettingsLongPress }: TabsProps) {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  // Settings 탭용 커스텀 버튼 (long-press 지원)
  const SettingsTabButton = useCallback(
    (props: BottomTabBarButtonProps) => (
      <AnimatedTabButton {...props} onLongPress={onSettingsLongPress} />
    ),
    [onSettingsLongPress],
  );

  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '300',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.tabBar,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
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
        component={AdminHomeWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AdminHomeTabIcon,
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
        component={SettingsScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AdminSettingsTabIcon,
          tabBarButton: SettingsTabButton,
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
  const [currentMode, setCurrentMode] = useState<AppMode>('general');
  const user = useUser();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const handleModeChange = useCallback((mode: AppMode) => {
    setCurrentMode(mode);
  }, []);

  // user.role이 'user'가 아닌 경우에만 모드 변경 기능 활성화
  const canChangeMode =
    user?.role &&
    (user.role === UserDtoRole.ADMIN || user.role === UserDtoRole.BREEDER);

  // 최초 1회 모드 전환 안내
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const checkModeGuide = async () => {
      if (!canChangeMode) {
        return;
      }

      try {
        // await AsyncStorage.removeItem(MODE_GUIDE_SHOWN_KEY);

        const hasShown = await AsyncStorage.getItem(MODE_GUIDE_SHOWN_KEY);

        if (!hasShown) {
          timeoutId = setTimeout(() => {
            setIsGuideVisible(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to check mode guide status:', error);
      }
    };

    checkModeGuide();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [canChangeMode]);

  const handleGuideClose = useCallback(async () => {
    setIsGuideVisible(false);
    try {
      await AsyncStorage.setItem(MODE_GUIDE_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Failed to save mode guide status:', error);
    }
  }, []);

  const handleSettingsLongPress = useCallback(() => {
    if (canChangeMode) {
      setIsModeSheetVisible(true);
    }
  }, [canChangeMode]);

  // 가이드 스포트라이트 롱프레스 핸들러
  const handleGuideSpotlightLongPress = useCallback(async () => {
    setIsGuideVisible(false);
    setIsModeSheetVisible(true);
    try {
      await AsyncStorage.setItem(MODE_GUIDE_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Failed to save mode guide status:', error);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />
      {currentMode === 'general' ? (
        <GeneralTabs onSettingsLongPress={handleSettingsLongPress} />
      ) : (
        <AdminTabs onSettingsLongPress={handleSettingsLongPress} />
      )}

      {/* 모드 선택 바텀시트 */}
      {canChangeMode && (
        <ModeSelectionSheet
          visible={isModeSheetVisible}
          onClose={() => setIsModeSheetVisible(false)}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
      )}

      {/* 최초 1회 모드 전환 가이드 */}
      <ModeGuideOverlay
        visible={isGuideVisible}
        onClose={handleGuideClose}
        onSpotlightLongPress={handleGuideSpotlightLongPress}
      />
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
  adminBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
