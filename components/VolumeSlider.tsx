/**
 * VolumeSlider Component
 * Reusable slider for volume control
 */

import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface VolumeSliderProps {
  value: number; // 0-1
  onValueChange: (value: number) => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ value, onValueChange }) => {
  const percentage = Math.round(value * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Volume</Text>
        <Text style={styles.value}>{percentage}%</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        step={0.01}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#E5E5EA"
        thumbTintColor="#007AFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

