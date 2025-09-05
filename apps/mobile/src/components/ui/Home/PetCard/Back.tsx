import React, { useMemo } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  PetDto,
  PetDtoGrowth,
  PetDtoSex,
  PetDtoSpecies,
} from '@repo/api-client';
import {
  GENDER_KOREAN_INFO,
  SPECIES_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  FIELD_LABELS,
} from '@/services/constant/form';
import { buildTransformedUrl, formatYyMmDd } from '@/utils/format';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/types/navigation';

type FormField =
  | {
      name: 'name' | 'desc' | 'weight' | 'hatchingDate';
      type: 'text' | 'textarea' | 'date';
    }
  | { name: 'sex' | 'species' | 'growth'; type: 'select' }
  | { name: 'traits' | 'foods'; type: 'multipleSelect' };

interface Props {
  pet: PetDto & Record<string, any>;
  onCloseBack?: () => void;
}

const CardBack: React.FC<Props> = ({ pet, onCloseBack }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const visibleFields: FormField[] = useMemo(
    () => [
      { name: 'name', type: 'text' },
      { name: 'sex', type: 'select' },
      { name: 'species', type: 'select' },
      { name: 'growth', type: 'select' },
      { name: 'traits', type: 'multipleSelect' },
      { name: 'foods', type: 'multipleSelect' },
      { name: 'hatchingDate', type: 'date' },
      { name: 'weight', type: 'text' },
      { name: 'desc', type: 'textarea' },
    ],
    [],
  );

  const renderValue = (field: FormField) => {
    if (field.name !== 'desc' && !pet[field.name]) {
      return <Text style={styles.muted}>-</Text>;
    }

    switch (field.type) {
      case 'textarea':
        return (
          <View style={styles.textarea}>
            <Text style={styles.textareaText}>
              {String(pet[field.name] || '')}
            </Text>
          </View>
        );
      case 'select':
        return (
          <Text style={styles.value}>
            {field.name === 'sex'
              ? GENDER_KOREAN_INFO[(pet[field.name] as PetDtoSex) ?? 'N'] ?? ''
              : field.name === 'species'
              ? SPECIES_KOREAN_INFO[pet[field.name] as PetDtoSpecies] ??
                String(pet[field.name] ?? '')
              : field.name === 'growth'
              ? GROWTH_KOREAN_INFO[pet[field.name] as PetDtoGrowth] ?? ''
              : String(pet[field.name] ?? '')}
          </Text>
        );
      case 'multipleSelect':
        return (
          <View style={styles.badgeRow}>
            {(Array.isArray(pet[field.name])
              ? (pet[field.name] as string[])
              : []
            ).map((item: string) => (
              <View key={item} style={styles.badge}>
                <Text style={styles.badgeText}>{item}</Text>
              </View>
            ))}
          </View>
        );
      case 'date': {
        const raw = pet[field.name];
        const str = typeof raw === 'string' ? raw : String(raw ?? '');
        return <Text style={styles.value}>{formatYyMmDd(str)}</Text>;
      }
      default:
        return (
          <Text style={styles.value}>{String(pet[field.name] ?? '')}</Text>
        );
    }
  };

  return (
    <Pressable style={styles.container} onPress={onCloseBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 혈통 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>혈통 정보</Text>
          <View style={styles.grid2}>
            <View style={styles.card}>
              <Text style={styles.parentLabel}>부</Text>
              {pet.father ? (
                <ImageBackground
                  source={{ uri: buildTransformedUrl(pet.father.photos?.[0]) }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                >
                  <Pressable
                    style={styles.parentCard}
                    onPress={() => {
                      if (!pet.father) return;

                      navigation.navigate('PetDetail', {
                        petId: pet.father.petId,
                      });
                    }}
                  >
                    <Text style={styles.parentName}>{pet.father.name}</Text>
                  </Pressable>
                </ImageBackground>
              ) : (
                <View style={styles.emptyBackgroundImage} />
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.parentLabel}>모</Text>
              {pet.mother ? (
                <ImageBackground
                  source={{ uri: buildTransformedUrl(pet.mother.photos?.[0]) }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                >
                  <Pressable
                    style={styles.parentCard}
                    onPress={e => {
                      e?.stopPropagation?.();
                      if (!pet.mother) return;

                      navigation.navigate('PetDetail', {
                        petId: pet.mother.petId,
                      });
                    }}
                  >
                    <Text style={styles.parentName}>{pet.mother.name}</Text>
                  </Pressable>
                </ImageBackground>
              ) : (
                <View style={styles.emptyBackgroundImage} />
              )}
            </View>
          </View>
        </View>

        {/* 사육 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사육 정보</Text>
          <View style={styles.fieldList}>
            {visibleFields.map(f => (
              <View
                key={f.name}
                style={[
                  styles.fieldRow,
                  f.type === 'textarea' && styles.fieldRowBlock,
                ]}
              >
                <Text style={styles.fieldLabel}>
                  {FIELD_LABELS[f.name] ?? f.name}
                </Text>
                <View style={styles.fieldValue}>{renderValue(f)}</View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Pressable>
  );
};

export default CardBack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  grid2: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
  },
  parentCard: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  backgroundImage: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyBackgroundImage: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  parentLabel: {
    color: '#111827',
    fontWeight: '600',
    paddingLeft: 4,
    paddingBottom: 4,
  },
  parentName: {
    position: 'absolute',
    bottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  fieldList: {
    gap: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldRowBlock: {
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: 88,
    color: '#374151',
    fontWeight: '600',
  },
  fieldValue: {
    flex: 1,
  },
  value: {
    color: '#111827',
  },
  textarea: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    padding: 12,
    minHeight: 120,
  },
  textareaText: {
    color: '#111827',
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  badgeText: {
    color: '#111827',
    fontSize: 13,
  },
  muted: {
    color: '#9CA3AF',
  },
});
