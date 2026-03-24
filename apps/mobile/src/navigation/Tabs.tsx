import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Pressable,
  Animated,
  Text,
  ScrollView,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import {
  ChevronLeft,
  Home,
  LogIn,
  Gem,
  Menu,
  PawPrint,
  Egg,
  HeartHandshake,
  Plus,
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import WebViewScreen from '../screens/WebView';
import LoginScreen from '../screens/Login';
import AddPetButton from '../components/common/AddPetButton';
import {
  GuestTabParamList,
  MemberMainTabParamList,
  PetTabParamList,
  SalesTabParamList,
} from '@/types/navigation';
import { useThemeStore, themeColors } from '@/store/theme';
import { useNavigationStore } from '@/store/navigation';
import useAuth, { useUser } from '@/hooks/useAuth';

const GuestTab = createBottomTabNavigator<GuestTabParamList>();
const MainTab = createBottomTabNavigator<MemberMainTabParamList>();
const PetTab = createBottomTabNavigator<PetTabParamList>();
const SalesTab = createBottomTabNavigator<SalesTabParamList>();

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
const HomeTabIcon = createAnimatedTabIcon(Home, '홈');
const LoginTabIcon = createAnimatedTabIcon(LogIn, '로그인');
const AllTabIcon = createAnimatedTabIcon(Menu, '전체');
const ManagePetTabIcon = createAnimatedTabIcon(PawPrint, '개체관리');
const PetListTabIcon = createAnimatedTabIcon(PawPrint, '개체룸');
const EggTabIcon = createAnimatedTabIcon(Egg, '브리딩룸');
const ManageSalesTabIcon = createAnimatedTabIcon(HeartHandshake, '분양관리');
const HeartTabIcon = createAnimatedTabIcon(HeartHandshake, '분양룸');
const ShowroomTabIcon = createAnimatedTabIcon(Gem, '쇼룸');
const AddPetTabIcon = ({ color }: { focused: boolean; color: string }) => (
  <View style={styles.tabIconContainer}>
    <View style={styles.addPetIconCircle}>
      <Plus size={15} color="#fff" strokeWidth={2.5} />
    </View>
    <Text style={[styles.tabLabel, { color }]}>개체추가</Text>
  </View>
);

// 빈 컴포넌트 (실제로 렌더링되지 않는 더미 스크린)
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

// 전체 메뉴 화면
type AllMenuItem = {
  icon: React.FC<{ size: number; color: string }>;
  label: string;
  action: 'tab' | 'pet' | 'sales' | 'webview';
  tabName?: string;
  petRoute?: keyof PetTabParamList;
  salesRoute?: keyof SalesTabParamList;
  path?: string;
};

const ALL_MENU_ITEMS: AllMenuItem[] = [
  { icon: Home, label: '홈', action: 'tab', tabName: 'Home' },
  { icon: Bell, label: '알림함', action: 'webview', path: '/notifications' },
  { icon: PawPrint, label: '개체룸', action: 'pet', petRoute: 'PetList' },
  { icon: Egg, label: '브리딩룸', action: 'pet', petRoute: 'Hatching' },
  { icon: HeartHandshake, label: '분양룸', action: 'sales', salesRoute: 'Adoption' },
  { icon: Gem, label: '쇼룸', action: 'sales', salesRoute: 'Showroom' },
  { icon: Settings, label: '설정', action: 'webview', path: '/settings' },
];

function AllMenuScreen({
  onEnterPet,
  onEnterSales,
}: {
  onEnterPet: (initialRoute?: keyof PetTabParamList) => void;
  onEnterSales: (initialRoute?: keyof SalesTabParamList) => void;
}) {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const rootNavigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const tabNavigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (item: AllMenuItem) => {
      switch (item.action) {
        case 'tab':
          if (item.tabName) {
            tabNavigation.navigate(item.tabName);
          }
          break;
        case 'pet':
          onEnterPet(item.petRoute);
          break;
        case 'sales':
          onEnterSales(item.salesRoute);
          break;
        case 'webview':
          if (item.path) {
            rootNavigation.navigate('Main', { path: item.path });
          }
          break;
      }
    },
    [tabNavigation, rootNavigation, onEnterPet, onEnterSales],
  );

  return (
    <ScrollView
      style={[
        styles.allMenuContainer,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
      contentContainerStyle={styles.allMenuContent}
    >
      <Text style={[styles.allMenuTitle, { color: colors.tabBarActive }]}>
        전체
      </Text>
      {ALL_MENU_ITEMS.map(item => (
        <Pressable
          key={item.label}
          style={[
            styles.allMenuItem,
            { borderBottomColor: colors.tabBarBorder },
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={styles.allMenuItemLeft}>
            <item.icon size={22} color={colors.tabBarActive} />
            <Text style={[styles.allMenuItemLabel, { color: colors.tabBarActive }]}>
              {item.label}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.tabBarInactive} />
        </Pressable>
      ))}
    </ScrollView>
  );
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
      <GuestTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: AddPetButton,
        }}
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

// 2depth 커스텀 탭바
function DepthTabBar({
  props,
  onGoBack,
  inactiveColor,
  activeColor,
  initialRoute,
  hasNavigatedRef,
}: {
  props: any;
  onGoBack: () => void;
  inactiveColor: string;
  activeColor: string;
  initialRoute?: string;
  hasNavigatedRef: React.RefObject<boolean>;
}) {
  if (!hasNavigatedRef.current && initialRoute) {
    hasNavigatedRef.current = true;
    setTimeout(() => props.navigation.navigate(initialRoute), 0);
  }

  return (
    <View
      style={[
        props.descriptors[props.state.routes[props.state.index].key].options
          .tabBarStyle as object,
      ]}
    >
      <View style={styles.manageTabBarInner}>
        <BackTabButton onGoBack={onGoBack} color={inactiveColor} />
        {props.state.routes.map(
          (route: { key: string; name: string }, index: number) => {
            const { options } = props.descriptors[route.key];
            const isFocused = props.state.index === index;
            const color = isFocused ? activeColor : inactiveColor;
            const icon = options.tabBarIcon as
              | ((p: {
                  focused: boolean;
                  color: string;
                }) => React.ReactNode)
              | undefined;

            return (
              <AnimatedTabButton
                key={route.key}
                onPress={() => {
                  const event = props.navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    props.navigation.navigate(route.name);
                  }
                }}
                style={styles.tabButton}
              >
                {icon?.({ focused: isFocused, color })}
              </AnimatedTabButton>
            );
          },
        )}
      </View>
    </View>
  );
}

// 뒤로가기 탭 버튼
function BackTabButton({
  onGoBack,
  color,
}: {
  onGoBack: () => void;
  color: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

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
      onPress={onGoBack}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View
        style={[styles.tabIconContainer, { transform: [{ scale }] }]}
      >
        <ChevronLeft size={TAB_ICON_SIZE} color={color} />
      </Animated.View>
    </Pressable>
  );
}

// 로그인 1depth 탭 (홈 / 개체 / (+) / 분양 / 전체)
function MemberMainTabs({
  onEnterPet,
  onEnterSales,
}: {
  onEnterPet: (initialRoute?: keyof PetTabParamList) => void;
  onEnterSales: (initialRoute?: keyof SalesTabParamList) => void;
}) {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  return (
    <MainTab.Navigator
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
      <MainTab.Screen
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
      <MainTab.Screen
        name="Pet"
        component={PetListWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ManagePetTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={() => ({
          tabPress: () => {
            onEnterPet();
          },
        })}
      />
      <MainTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: AddPetButton,
        }}
      />
      <MainTab.Screen
        name="Sales"
        component={AdoptionWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ManageSalesTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={() => ({
          tabPress: () => {
            onEnterSales();
          },
        })}
      />
      <MainTab.Screen
        name="All"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AllTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
      >
        {() => (
          <AllMenuScreen
            onEnterPet={onEnterPet}
            onEnterSales={onEnterSales}
          />
        )}
      </MainTab.Screen>
    </MainTab.Navigator>
  );
}

// 로그인 2depth 개체 탭 (뒤로 / 개체룸 / 브리딩룸 / 개체추가)
function PetTabs({
  onGoBack,
  initialRoute,
}: {
  onGoBack: () => void;
  initialRoute?: keyof PetTabParamList;
}) {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const rootNavigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;
  const hasNavigatedRef = useRef(false);

  return (
    <PetTab.Navigator
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
      tabBar={tabBarProps => (
        <DepthTabBar
          props={tabBarProps}
          onGoBack={onGoBack}
          inactiveColor={colors.tabBarInactive}
          activeColor={colors.tabBarActive}
          initialRoute={initialRoute}
          hasNavigatedRef={hasNavigatedRef}
        />
      )}
    >
      <PetTab.Screen
        name="PetList"
        component={PetListWebView}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: PetListTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerScrollToTop('PetList');
            }
          },
        })}
      />
      <PetTab.Screen
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
      <PetTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AddPetTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={() => ({
          tabPress: (e: { preventDefault: () => void }) => {
            e.preventDefault();
            rootNavigation.navigate('Main', {
              path: '/register/1?_hideTopBar=1',
            });
          },
        })}
      />
    </PetTab.Navigator>
  );
}

// 로그인 2depth 분양 탭 (뒤로 / 분양룸 / 쇼룸 / 개체추가)
function SalesTabs({
  onGoBack,
  initialRoute,
}: {
  onGoBack: () => void;
  initialRoute?: keyof SalesTabParamList;
}) {
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];
  const insets = useSafeAreaInsets();
  const rootNavigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const triggerScrollToTop = useNavigationStore(
    state => state.triggerScrollToTop,
  );

  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;
  const hasNavigatedRef = useRef(false);

  return (
    <SalesTab.Navigator
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
      tabBar={tabBarProps => (
        <DepthTabBar
          props={tabBarProps}
          onGoBack={onGoBack}
          inactiveColor={colors.tabBarInactive}
          activeColor={colors.tabBarActive}
          initialRoute={initialRoute}
          hasNavigatedRef={hasNavigatedRef}
        />
      )}
    >
      <SalesTab.Screen
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
      <SalesTab.Screen
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
      <SalesTab.Screen
        name="AddPet"
        component={EmptyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: AddPetTabIcon,
          tabBarButton: AnimatedTabButton,
        }}
        listeners={() => ({
          tabPress: (e: { preventDefault: () => void }) => {
            e.preventDefault();
            rootNavigation.navigate('Main', {
              path: '/register/1?_hideTopBar=1',
            });
          },
        })}
      />
    </SalesTab.Navigator>
  );
}

type DepthMode =
  | { depth: 'main' }
  | { depth: 'pet'; initialRoute?: keyof PetTabParamList }
  | { depth: 'sales'; initialRoute?: keyof SalesTabParamList };

// 로그인 사용자 탭 (1depth ↔ 2depth 전환)
function MemberTabs() {
  const [mode, setMode] = useState<DepthMode>({ depth: 'main' });

  const enterPet = useCallback(
    (initialRoute?: keyof PetTabParamList) =>
      setMode({ depth: 'pet', initialRoute }),
    [],
  );
  const enterSales = useCallback(
    (initialRoute?: keyof SalesTabParamList) =>
      setMode({ depth: 'sales', initialRoute }),
    [],
  );
  const goBack = useCallback(() => setMode({ depth: 'main' }), []);

  if (mode.depth === 'pet') {
    return (
      <PetTabs
        key={`pet-${mode.initialRoute ?? 'default'}`}
        onGoBack={goBack}
        initialRoute={mode.initialRoute}
      />
    );
  }

  if (mode.depth === 'sales') {
    return (
      <SalesTabs
        key={`sales-${mode.initialRoute ?? 'default'}`}
        onGoBack={goBack}
        initialRoute={mode.initialRoute}
      />
    );
  }

  return (
    <MemberMainTabs
      onEnterPet={enterPet}
      onEnterSales={enterSales}
    />
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
  manageTabBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
  addPetIconCircle: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    borderRadius: TAB_ICON_SIZE / 2,
    backgroundColor: '#2D3645',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allMenuContainer: {
    flex: 1,
  },
  allMenuContent: {
    padding: 20,
    paddingBottom: 100,
  },
  allMenuTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  allMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  allMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  allMenuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
