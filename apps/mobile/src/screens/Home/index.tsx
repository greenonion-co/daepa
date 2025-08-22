import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import {
  brPetControllerFindAll,
  BrPetControllerFindAllFilterType,
  PetDto,
} from '@repo/api-client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { tokenStorage } from '../../utils/tokenStorage';
import PetCard from '../../components/ui/Home/PetCard';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_PER_PAGE = 10;

const HomeScreen = () => {
  const height = useWindowDimensions().height;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const cardHeight = height - insets.top - tabBarHeight;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        brPetControllerFindAll.name,
        BrPetControllerFindAllFilterType.ALL,
      ],
      queryFn: ({ pageParam = 1 }) =>
        brPetControllerFindAll({
          page: pageParam,
          itemPerPage: ITEM_PER_PAGE,
          order: 'DESC',
          filterType: BrPetControllerFindAllFilterType.ALL,
          // ...searchFilters,
        }),
      initialPageParam: 1,
      getNextPageParam: lastPage => {
        if (lastPage.data.meta.hasNextPage) {
          return lastPage.data.meta.page + 1;
        }
        return undefined;
      },
      select: resp => ({
        items: resp.pages.flatMap(p => p.data.data),
        totalCount: resp.pages[0]?.data.meta.totalCount ?? 0,
      }),
    });

  const { items } = data ?? { items: [], totalCount: 0 };

  const renderItem = ({ item }: { item: PetDto }) => {
    return <PetCard pet={item} cardHeight={cardHeight} />;
  };

  useEffect(() => {
    tokenStorage.setToken(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwWk5CSEkiLCJzdGF0dXMiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNzU1MDkxNTk4LCJleHAiOjE3NTUwOTUxOTh9.WrM_rLTag6gEAtEEWmvKwknGTxKfSaUsGm8dhE_1kK4',
    );
  }, []);

  if (isFetchingNextPage) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <FlatList
        data={items}
        keyExtractor={item => item.petId}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingNextPage}
            onRefresh={fetchNextPage}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator />
            </View>
          ) : !hasNextPage ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>더 이상 개체가 없습니다</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
  },
});

export default HomeScreen;
