/**
 * NoiseTypeSelector Component
 * Select noise color type
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NoiseColor } from '../lib/types/audio';

interface NoiseTypeSelectorProps {
  selectedColor: NoiseColor;
  onColorChange: (color: NoiseColor) => void;
  disabled?: boolean;
}

const NOISE_COLORS: { value: NoiseColor; label: string; description: string }[] = [
  { value: 'white', label: 'White', description: 'All frequencies equally' },
  { value: 'pink', label: 'Pink', description: 'Balanced, natural' },
  { value: 'brown', label: 'Brown', description: 'Deep, rumbling' },
  { value: 'green', label: 'Green', description: 'Mid-range focus' },
];

export const NoiseTypeSelector: React.FC<NoiseTypeSelectorProps> = ({
  selectedColor,
  onColorChange,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Noise Type</Text>
      <View style={styles.grid}>
        {NOISE_COLORS.map((noise) => (
          <TouchableOpacity
            key={noise.value}
            style={[
              styles.card,
              selectedColor === noise.value && styles.cardActive,
              disabled && styles.cardDisabled,
            ]}
            onPress={() => onColorChange(noise.value)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.cardTitle,
                selectedColor === noise.value && styles.cardTitleActive,
              ]}
            >
              {noise.label}
            </Text>
            <Text
              style={[
                styles.cardDescription,
                selectedColor === noise.value && styles.cardDescriptionActive,
              ]}
            >
              {noise.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    backgroundColor: '#E3F2FF',
    borderColor: '#007AFF',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardTitleActive: {
    color: '#007AFF',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
  },
  cardDescriptionActive: {
    color: '#0051A8',
  },
});

