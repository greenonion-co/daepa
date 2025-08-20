import PetCard from '../../components/ui/Home/PetCard';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { petControllerFindPetByPetId } from '@repo/api-client';
import { SafeAreaView, StyleSheet, useWindowDimensions } from 'react-native';
import TopBar from '../../components/common/TopBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PetDetailScreen = () => {
  const { petId } = useRoute().params as { petId: string };
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const cardHeight = height - insets.top - 56;

  const { data: pet } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: res => res.data.data,
    enabled: !!petId,
  });

  if (!pet) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={pet.name} />
      <PetCard pet={pet} cardHeight={cardHeight} />
    </SafeAreaView>
  );
};

export default PetDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
