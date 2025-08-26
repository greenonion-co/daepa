import { View } from 'react-native';

interface VoidSpaceProps {
  height?: number;
  width?: number;
}

const VoidSpace = ({ height, width }: VoidSpaceProps) => {
  return <View style={{ height, width }} />;
};

export default VoidSpace;
