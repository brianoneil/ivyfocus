/**
 * PlaybackControls Component
 * Play/Stop button for audio playback
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlay,
  onStop,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPlaying ? styles.buttonStop : styles.buttonPlay,
        disabled && styles.buttonDisabled,
      ]}
      onPress={isPlaying ? onStop : onPlay}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{isPlaying ? '⏹ Stop' : '▶ Play'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  buttonPlay: {
    backgroundColor: '#34C759',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});

