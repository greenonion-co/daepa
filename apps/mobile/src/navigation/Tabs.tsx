import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  FileChartColumnIncreasing,
  Calendar,
  ContactRound,
} from 'lucide-react-native';
import WebViewScreen from '../screens/WebView';
import GuestSettingsScreen from '../screens/Settings/GuestSettings';
import FloatingModeButton, {
  AppMode,
} from '../components/common/FloatingModeButton';
import AddPetButton from '../components/common/AddPetButton';
import { GeneralTabParamList, AdminTabParamList } from '@/types/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, themeColors } from '@/store/theme';
import { UserDtoRole } from '@repo/api-client';

const GeneralTab = createBottomTabNavigator<GeneralTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

const TAB_ICON_SIZE = 24;

// 탭 아이콘 컴포넌트들
const HomeIcon = ({ color }: { color: string }) => (
  <Home size={TAB_ICON_SIZE} color={color} />
);
const SettingsIcon = ({ color }: { color: string }) => (
  <ContactRound size={TAB_ICON_SIZE} color={color} />
);
const EggIcon = ({ color }: { color: string }) => (
  <Calendar size={TAB_ICON_SIZE} color={color} />
);
const HeartIcon = ({ color }: { color: string }) => (
  <FileChartColumnIncreasing size={TAB_ICON_SIZE} color={color} />
);

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
  const accessToken = useAuthStore(state => state.accessToken);

  if (!accessToken) {
    return <GuestSettingsScreen />;
  }

  return <SettingsWebView />;
}

// 일반 모드 탭
function GeneralTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <>
      <GeneralTab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
          tabBarIconStyle: {
            marginBottom: 5,
          },
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
            paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
            height: tabBarHeight,
          },
          tabBarHideOnKeyboard: true,
        }}
      >
        <GeneralTab.Screen
          name="Home"
          component={HomeWebView}
          options={{
            tabBarLabel: '홈',
            tabBarIcon: HomeIcon,
          }}
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
            tabBarLabel: '설정',
            tabBarIcon: SettingsIcon,
          }}
        />
      </GeneralTab.Navigator>
    </>
  );
}

// 관리자 모드 탭
function AdminTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 5,
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
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
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
          tabBarLabel: '홈',
          tabBarIcon: HomeIcon,
        }}
      />
      <AdminTab.Screen
        name="Hatching"
        component={HatchingWebView}
        options={{
          tabBarLabel: '해칭룸',
          tabBarIcon: EggIcon,
        }}
      />
      <AdminTab.Screen
        name="Adoption"
        component={AdoptionWebView}
        options={{
          tabBarLabel: '분양룸',
          tabBarIcon: HeartIcon,
        }}
      />
      <AdminTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'My',
          tabBarIcon: SettingsIcon,
        }}
      />
    </AdminTab.Navigator>
  );
}

export default function Tabs() {
  const [currentMode, setCurrentMode] = useState<AppMode>('general');
  const user = useAuthStore(state => state.user);
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];

  const handleModeChange = useCallback((mode: AppMode) => {
    setCurrentMode(mode);
  }, []);

  // user.role이 'user'가 아닌 경우에만 모드 변경 버튼 표시
  const showModeButton =
    user?.role &&
    (user.role === UserDtoRole.ADMIN || user.role === UserDtoRole.BREEDER);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />
      {currentMode === 'general' ? <GeneralTabs /> : <AdminTabs />}

      {/* 일반/관리자 모드 변경 버튼 (user 역할이 아닌 경우에만 표시) */}
      {showModeButton && (
        <FloatingModeButton
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
