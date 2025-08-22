import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import type { PetDto } from '@repo/api-client';
import CardBack from './Back';
import CardFront from './Front';

interface Props {
  pet: PetDto;
  cardHeight: number;
}

const ShortsCard: React.FC<Props> = ({ pet, cardHeight }) => {
  const [flipped, setFlipped] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  const frontInterpolate = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
      }),
    [rotate],
  );

  const backInterpolate = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
      }),
    [rotate],
  );

  const onToggle = () => {
    Animated.timing(rotate, {
      toValue: flipped ? 0 : 180,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setFlipped(!flipped));
  };

  const frontStyle = useMemo(
    () => [{ transform: [{ rotateY: frontInterpolate }] }, styles.absoluteFill],
    [frontInterpolate],
  );
  const backStyle = useMemo(
    () => [{ transform: [{ rotateY: backInterpolate }] }, styles.absoluteFill],
    [backInterpolate],
  );

  return (
    <Pressable
      style={[styles.container, { height: cardHeight }]}
      onPress={onToggle}
    >
      <Animated.View style={frontStyle}>
        <CardFront pet={pet} height={cardHeight} />
      </Animated.View>

      <Animated.View style={backStyle}>
        <CardBack pet={pet} onCloseBack={onToggle} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
});

export default ShortsCard;
