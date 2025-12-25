/**
 * ModeSelector Component
 * Toggle between binaural and noise modes
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AudioMode } from '../lib/types/audio';

interface ModeSelectorProps {
  selectedMode: AudioMode | null;
  onModeChange: (mode: AudioMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Audio Mode</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.leftButton,
            selectedMode === 'binaural' && styles.buttonActive,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => onModeChange('binaural')}
          disabled={disabled}
        >
          <Text
            style={[
              styles.buttonText,
              selectedMode === 'binaural' && styles.buttonTextActive,
            ]}
          >
            Binaural
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.rightButton,
            selectedMode === 'noise' && styles.buttonActive,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => onModeChange('noise')}
          disabled={disabled}
        >
          <Text
            style={[
              styles.buttonText,
              selectedMode === 'noise' && styles.buttonTextActive,
            ]}
          >
            Noise
          </Text>
        </TouchableOpacity>
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
  buttonContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  rightButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonTextActive: {
    color: '#FFF',
  },
});

