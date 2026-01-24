import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  FileChartColumnIncreasing,
  Calendar,
  ContactRound,
  Plus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import WebViewScreen from '../screens/WebView';
import GuestSettingsScreen from '../screens/Settings/GuestSettings';
import FloatingModeButton, {
  AppMode,
} from '../components/common/FloatingModeButton';
import { GeneralTabParamList, AdminTabParamList } from '@/types/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore, themeColors } from '@/store/theme';
import { UserDtoRole } from '@repo/api-client';
import { openLoginPromoSheet } from '@/components/common/LoginPromoSheet';

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

// 중앙 + 버튼 컴포넌트
function AddPetButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.addButtonContainer}
    >
      <View style={styles.addButtonInner}>
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
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
  const { isLoggedIn } = useAuthStore();
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleAddPet = useCallback(
    (loggedIn: boolean) => {
      if (loggedIn) {
        navigation.navigate('Main', { path: '/register/1' });
      } else {
        openLoginPromoSheet();
      }
    },
    [navigation],
  );

  return (
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
          backgroundColor: colors.tabBar,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.tabBarBorder,
        },
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
          tabBarButton: () => (
            <AddPetButton onPress={() => handleAddPet(isLoggedIn)} />
          ),
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
  );
}

// 관리자 모드 탭
function AdminTabs() {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];

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
          backgroundColor: colors.tabBar,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.tabBarBorder,
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
  addButtonContainer: {
    flex: 1,
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
