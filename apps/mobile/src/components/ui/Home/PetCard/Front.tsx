import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PetDto } from '@repo/api-client';
import { buildTransformedUrl, formatYyMmDd } from '@/utils/format';
import {
  GENDER_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
} from '@/services/constant/form';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  pet: PetDto;
  qrCodeDataUrl?: string;
  height?: number;
};

const CardFront: React.FC<Props> = ({
  pet,
  qrCodeDataUrl,
  height = SCREEN_HEIGHT,
}) => {
  const allImages = pet.photos ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.card}>
        {/* 이미지 캐러셀 */}
        <View style={styles.imageWrap}>
          {allImages.length > 0 && (
            <FlatList
              data={allImages}
              keyExtractor={(uri, idx) => `${uri}-${idx}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={({ viewableItems }) => {
                if (viewableItems?.[0]?.index != null)
                  setCurrentIndex(viewableItems[0].index);
              }}
              viewabilityConfig={viewabilityConfig}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: buildTransformedUrl(item) }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
            />
          )}

          {/* 이미지 인디케이터 */}
          {allImages.length > 1 && (
            <View style={styles.indicatorRow}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { opacity: currentIndex === i ? 1 : 0.5 },
                  ]}
                />
              ))}
            </View>
          )}

          {/* QR 오버레이 */}
          {qrCodeDataUrl ? (
            <Image
              source={{ uri: qrCodeDataUrl }}
              style={styles.qr}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {/* 하단 정보 오버레이 */}
        <View style={styles.bottomOverlay}>
          <View style={styles.gradientLike} />
          <View style={styles.infoBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{pet.name || '-'}</Text>
              <View style={styles.subTextWrap}>
                <Text style={styles.subText}>
                  {pet.weight ? `${pet.weight}g / ` : ''}
                  {formatYyMmDd(pet.hatchingDate)}
                </Text>
                <Text style={styles.subText}>
                  {SPECIES_KOREAN_INFO[pet.species]} /{' '}
                  {GENDER_KOREAN_INFO[pet.sex ?? 'N']}
                </Text>
              </View>
            </View>

            {/* 모프/형질 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgeRow}>
                {(pet.morphs ?? []).map(m => (
                  <View
                    key={`m-${m}`}
                    style={[styles.badge, styles.badgeYellow]}
                  >
                    <Text style={[styles.badgeText, styles.badgeTextDark]}>
                      #{m}
                    </Text>
                  </View>
                ))}
                {(pet.traits ?? []).map(t => (
                  <View
                    key={`t-${t}`}
                    style={[styles.badge, styles.badgeWhite]}
                  >
                    <Text style={[styles.badgeText, styles.badgeTextDark]}>
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {!!pet.desc && (
              <Text style={styles.desc} numberOfLines={1} ellipsizeMode="tail">
                {pet.desc}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default CardFront;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  imageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  placeholderText: {
    color: '#6B7280',
  },
  indicatorRow: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  qr: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 60,
    height: 60,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  gradientLike: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // 간단한 그라데이션 대체: 아래쪽 어둡게
    // 필요 시 react-native-linear-gradient로 교체 가능
    borderTopColor: 'transparent',
  },
  infoBlock: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'column',
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subTextWrap: {
    gap: 2,
  },
  subText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeYellow: {
    backgroundColor: 'rgba(234,179,8,0.8)',
  },
  badgeWhite: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontWeight: '700',
  },
  badgeTextDark: {
    color: '#111827',
  },
  desc: {
    color: '#D1D5DB',
    fontSize: 12,
  },
});
