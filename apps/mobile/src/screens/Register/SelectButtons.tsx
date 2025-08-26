import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SelectButtons = ({
  label,
  selectList,
  value,
  setValue,
}: {
  label: string;
  selectList: { label: string; value: string }[];
  value: string;
  setValue: (value: string) => void;
}) => {
  if (!selectList || selectList.length !== 2) {
    console.warn('SelectButtons: selectList must contain exactly 2 items.');
    return null;
  }
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentedWrap}>
        <TouchableOpacity
          style={[
            styles.segment,
            value === selectList[0].value && styles.segmentActive,
          ]}
          onPress={() => setValue(selectList[0].value)}
        >
          <Text
            style={[
              styles.segmentText,
              value === selectList[0].value && styles.segmentTextActive,
            ]}
          >
            {selectList[0].label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            value === selectList[1].value && styles.segmentActive,
          ]}
          onPress={() => setValue(selectList[1].value)}
        >
          <Text
            style={[
              styles.segmentText,
              value === selectList[1].value && styles.segmentTextActive,
            ]}
          >
            {selectList[1].label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SelectButtons;

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  segmentedWrap: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  segmentActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  segmentText: {
    color: '#374151',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
});
