import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LavaLamp } from '../components/LavaLamp';
import { useAudio } from '../lib/context/AudioContext';
import type { AudioMode } from '../lib/types/audio';

const COLS = 12;
const { width, height } = Dimensions.get('screen');
const _circleBoxSize = width / COLS;
const ROWS = Math.round(height / _circleBoxSize);
const dots = [...Array(ROWS).keys()].map((rowIndex) =>
  [...Array(COLS).keys()].map((colIndex) => ({
    key: rowIndex * COLS + colIndex,
    row: rowIndex,
    col: colIndex,
  }))
);

const _distanceIndex = 1; // Euclidian distance
const _staggerDelay = 60;

function distanceAlgo(X1: number = 0, Y1: number = 0, X2: number = 0, Y2: number = 0) {
  'worklet';
  const distanceX = X2 - X1;
  const distanceY = Y2 - Y1;

  if (_distanceIndex === 0) {
    // Manhattan distance
    return Math.abs(X1 - X2) + Math.abs(Y1 - Y2);
  }
  if (_distanceIndex === 1) {
    // Euclidian distance
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  }
  if (_distanceIndex === 2) {
    // Chebyshev distance
    return Math.max(Math.abs(X1 - X2), Math.abs(Y1 - Y2));
  }
  return 0;
}

type DotProps = {
  dot: (typeof dots)[0][0];
  fromIndex: SharedValue<(typeof dots)[0][0]>;
  dotColor: string;
};

const Dot = ({ dot, fromIndex, dotColor }: DotProps) => {
  const distance = useDerivedValue(() => {
    return distanceAlgo(fromIndex.value.col, fromIndex.value.row, dot.col, dot.row) * _staggerDelay;
  });

  const stylez = useAnimatedStyle(() => {
    const scale = withDelay(
      distance.value,
      withSequence(
        withTiming(1, { duration: _staggerDelay * 5 }),
        withTiming(0.3, { duration: _staggerDelay * 3 })
      )
    );
    const color = withDelay(
      distance.value,
      withSequence(
        withTiming(1.0, { duration: _staggerDelay * 3 }),
        withTiming(0.2, { duration: _staggerDelay * 3 })
      )
    );
    return {
      opacity: color,
      transform: [{ scale: scale }],
    };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: dotColor }, stylez]}
      removeClippedSubviews
      renderToHardwareTextureAndroid
    />
  );
};

// Color scheme for different presets and noise types
const PRESET_COLORS = {
  theta: { bg: 'rgba(147, 51, 234, 0.3)', border: 'rgba(147, 51, 234, 0.6)', text: '#a78bfa' }, // Purple
  alpha: { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.6)', text: '#60a5fa' }, // Blue
  beta: { bg: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 0.6)', text: '#fb923c' }, // Orange
};

const NOISE_COLORS = {
  white: { bg: 'rgba(229, 229, 229, 0.3)', border: 'rgba(229, 229, 229, 0.6)', text: '#e5e5e5' }, // Light gray
  pink: { bg: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 0.6)', text: '#f472b6' }, // Pink
  brown: { bg: 'rgba(180, 83, 9, 0.3)', border: 'rgba(180, 83, 9, 0.6)', text: '#d97706' }, // Brown/Amber
  green: { bg: 'rgba(34, 197, 94, 0.3)', border: 'rgba(34, 197, 94, 0.6)', text: '#4ade80' }, // Green
};

export default function Index() {
  const audio = useAudio();
  const [selectedMode, setSelectedMode] = useState<AudioMode>('binaural');
  const fromIndex = useSharedValue(dots[Math.round(ROWS / 2)][Math.round(COLS / 2)]);

  const handleModeChange = (mode: AudioMode) => {
    if (!audio.isPlaying) {
      setSelectedMode(mode);
    }
  };

  const handlePlay = () => {
    if (selectedMode === 'binaural') {
      audio.startBinaural();
    } else {
      audio.startNoise();
    }
  };

  const handleStop = () => {
    audio.stop();
  };

  // Get dot color based on current mode and settings
  const getDotColor = () => {
    if (selectedMode === 'binaural') {
      if (audio.beat >= 4 && audio.beat <= 7) {
        return PRESET_COLORS.theta.text;
      } else if (audio.beat >= 8 && audio.beat <= 13) {
        return PRESET_COLORS.alpha.text;
      } else if (audio.beat >= 14 && audio.beat <= 20) {
        return PRESET_COLORS.beta.text;
      }
    } else {
      // Noise mode
      switch (audio.noiseColor) {
        case 'white':
          return NOISE_COLORS.white.text;
        case 'pink':
          return NOISE_COLORS.pink.text;
        case 'brown':
          return NOISE_COLORS.brown.text;
        case 'green':
          return NOISE_COLORS.green.text;
      }
    }
    return 'gold'; // Default fallback
  };

  // Get lava lamp hue based on current mode and settings
  const getLavaHue = () => {
    if (selectedMode === 'binaural') {
      if (audio.beat >= 4 && audio.beat <= 7) {
        return 'purple'; // Theta - deep relaxation
      } else if (audio.beat >= 8 && audio.beat <= 13) {
        return 'blue'; // Alpha - calm focus
      } else if (audio.beat >= 14 && audio.beat <= 20) {
        return 'orange'; // Beta - active focus
      }
    } else {
      // Noise mode
      switch (audio.noiseColor) {
        case 'white':
          return 'monochrome';
        case 'pink':
          return 'red'; // Use red hue for darker, less bright pink tones
        case 'brown':
          return 'orange';
        case 'green':
          return 'green';
      }
    }
    return 'blue'; // Default fallback
  };

  const dotColor = getDotColor();
  const lavaHue = getLavaHue();

  // Animate dots based on playback state and mode
  useEffect(() => {
    if (!audio.isPlaying) {
      // Idle animation: infrequent horizontal line sweeping from bottom to top
      let waveInterval: NodeJS.Timeout | null = null;
      let nextWaveTimeout: NodeJS.Timeout | null = null;

      const triggerWave = () => {
        let currentRow = ROWS - 1; // Start from bottom

        // Animate horizontal line moving up
        waveInterval = setInterval(() => {
          if (currentRow >= 0) {
            // Trigger all dots in current row (and row above for 2-row thick line)
            for (let col = 0; col < COLS; col++) {
              fromIndex.value = dots[currentRow][col];
            }
            // Also trigger the row above for a thicker line effect
            if (currentRow > 0) {
              for (let col = 0; col < COLS; col++) {
                fromIndex.value = dots[currentRow - 1][col];
              }
            }
            currentRow = currentRow - 1;
          } else {
            // Wave completed, clear interval and schedule next wave
            if (waveInterval) clearInterval(waveInterval);
            scheduleNextWave();
          }
        }, 100); // Speed of line sweeping up
      };

      const scheduleNextWave = () => {
        // Wait 4-10 seconds before next wave
        const delay = 4000 + Math.random() * 6000;
        nextWaveTimeout = setTimeout(triggerWave, delay);
      };

      // Start the first wave after initial delay
      scheduleNextWave();

      return () => {
        if (waveInterval) clearInterval(waveInterval);
        if (nextWaveTimeout) clearTimeout(nextWaveTimeout);
      };
    }

    const centerRow = Math.round(ROWS / 2);
    const centerCol = Math.round(COLS / 2);

    if (selectedMode === 'noise') {
      // Noise mode: random pulses from various points for chaotic effect
      const interval = setInterval(() => {
        // Generate random position
        const randomRow = Math.floor(Math.random() * ROWS);
        const randomCol = Math.floor(Math.random() * COLS);
        fromIndex.value = dots[randomRow][randomCol];
      }, 500); // Pulse every 500ms from random locations

      return () => clearInterval(interval);
    } else {
      // Binaural mode: wave flowing across the screen from random starting points
      let currentCol = 0;
      let currentRow = Math.floor(Math.random() * ROWS); // Random starting row

      const interval = setInterval(() => {
        fromIndex.value = dots[currentRow][currentCol];
        currentCol = (currentCol + 1) % COLS; // Move to next column, wrap around

        // When we complete a full wave, pick a new random row for the next wave
        if (currentCol === 0) {
          currentRow = Math.floor(Math.random() * ROWS);
        }
      }, 200); // Move across every 200ms for smooth wave effect

      return () => clearInterval(interval);
    }
  }, [audio.isPlaying, selectedMode, fromIndex]);

  // Get current mode description
  const getModeDescription = () => {
    if (selectedMode === 'binaural') {
      return `${audio.carrier} Hz + ${audio.beat} Hz beat`;
    } else {
      return `${audio.noiseColor.charAt(0).toUpperCase() + audio.noiseColor.slice(1)} Noise`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background - Conditional rendering based on backgroundType */}
      {audio.backgroundType === 'dots' ? (
        <View style={styles.dotGridContainer}>
          {dots.map((row, rowIndex) => {
            return (
              <View style={{ flexDirection: 'row' }} key={rowIndex}>
                {row.map((dot) => {
                  return (
                    <TouchableOpacity
                      key={dot.key.toString()}
                      onPress={() => {
                        fromIndex.value = dot;
                      }}
                      activeOpacity={1}>
                      <Dot dot={dot} fromIndex={fromIndex} dotColor={dotColor} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      ) : (
        <LavaLamp
          hue={lavaHue}
          intensity={Math.round(100 * (1 - audio.uiDimness * 0.5))}
          count={5}
          duration={audio.isPlaying ? 8000 : 25000}
        />
      )}

      {/* Settings Button - Top Right */}
      <Link href="/settings" asChild style={styles.settingsButtonContainer}>
        <TouchableOpacity style={[
          styles.settingsButton,
          {
            backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
            borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
          }
        ]}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </Link>

      {/* Mode Selector - Top Center with Glassmorphism */}
      <View style={styles.modeSelectorContainer}>
        <View style={[styles.glassContainer, {
          backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
          borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
        }]}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                  borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                },
                selectedMode === 'binaural' && styles.modeButtonActive
              ]}
              onPress={() => handleModeChange('binaural')}
              disabled={audio.isPlaying}>
              <Text
                style={[
                  styles.modeButtonText,
                  { color: `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})` },
                  selectedMode === 'binaural' && styles.modeButtonTextActive,
                ]}>
                Binaural
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                {
                  backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                  borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                },
                selectedMode === 'noise' && styles.modeButtonActive
              ]}
              onPress={() => handleModeChange('noise')}
              disabled={audio.isPlaying}>
              <Text
                style={[
                  styles.modeButtonText,
                  { color: `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})` },
                  selectedMode === 'noise' && styles.modeButtonTextActive,
                ]}>
                Noise
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Options Selector - Shows presets for binaural or noise types for noise */}
      <View style={styles.optionsContainer}>
        <View style={[styles.glassContainer, {
          backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
          borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
        }]}>
          {selectedMode === 'binaural' ? (
            // Binaural Presets
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.beat >= 4 && audio.beat <= 7
                      ? PRESET_COLORS.theta.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.beat >= 4 && audio.beat <= 7
                      ? PRESET_COLORS.theta.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setBeat(6)}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.beat >= 4 && audio.beat <= 7
                      ? PRESET_COLORS.theta.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Theta</Text>
                <Text style={[
                  styles.optionDetail,
                  {
                    color: audio.beat >= 4 && audio.beat <= 7
                      ? PRESET_COLORS.theta.text
                      : `rgba(255, 255, 255, ${0.5 * (1 - audio.uiDimness * 0.85)})`
                  }
                ]}>6 Hz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.beat >= 8 && audio.beat <= 13
                      ? PRESET_COLORS.alpha.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.beat >= 8 && audio.beat <= 13
                      ? PRESET_COLORS.alpha.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setBeat(10)}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.beat >= 8 && audio.beat <= 13
                      ? PRESET_COLORS.alpha.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Alpha</Text>
                <Text style={[
                  styles.optionDetail,
                  {
                    color: audio.beat >= 8 && audio.beat <= 13
                      ? PRESET_COLORS.alpha.text
                      : `rgba(255, 255, 255, ${0.5 * (1 - audio.uiDimness * 0.85)})`
                  }
                ]}>10 Hz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.beat >= 14 && audio.beat <= 20
                      ? PRESET_COLORS.beta.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.beat >= 14 && audio.beat <= 20
                      ? PRESET_COLORS.beta.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setBeat(16)}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.beat >= 14 && audio.beat <= 20
                      ? PRESET_COLORS.beta.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Beta</Text>
                <Text style={[
                  styles.optionDetail,
                  {
                    color: audio.beat >= 14 && audio.beat <= 20
                      ? PRESET_COLORS.beta.text
                      : `rgba(255, 255, 255, ${0.5 * (1 - audio.uiDimness * 0.85)})`
                  }
                ]}>16 Hz</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Noise Types
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.noiseColor === 'white'
                      ? NOISE_COLORS.white.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.noiseColor === 'white'
                      ? NOISE_COLORS.white.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setNoiseColor('white')}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.noiseColor === 'white'
                      ? NOISE_COLORS.white.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>White</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.noiseColor === 'pink'
                      ? NOISE_COLORS.pink.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.noiseColor === 'pink'
                      ? NOISE_COLORS.pink.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setNoiseColor('pink')}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.noiseColor === 'pink'
                      ? NOISE_COLORS.pink.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Pink</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.noiseColor === 'brown'
                      ? NOISE_COLORS.brown.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.noiseColor === 'brown'
                      ? NOISE_COLORS.brown.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setNoiseColor('brown')}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.noiseColor === 'brown'
                      ? NOISE_COLORS.brown.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Brown</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: audio.noiseColor === 'green'
                      ? NOISE_COLORS.green.bg
                      : `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
                    borderColor: audio.noiseColor === 'green'
                      ? NOISE_COLORS.green.border
                      : `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
                  },
                ]}
                onPress={() => audio.setNoiseColor('green')}>
                <Text style={[
                  styles.optionName,
                  {
                    color: audio.noiseColor === 'green'
                      ? NOISE_COLORS.green.text
                      : `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})`
                  },
                ]}>Green</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Play/Stop Button - Center with Glassmorphism */}
      <View style={styles.playButtonContainer}>
        <TouchableOpacity
          style={[
            styles.glassPlayButton,
            {
              backgroundColor: `rgba(255, 255, 255, ${0.15 * (1 - audio.uiDimness * 0.85)})`,
              borderColor: `rgba(255, 255, 255, ${0.3 * (1 - audio.uiDimness * 0.85)})`,
            },
            audio.isPlaying && styles.glassPlayButtonActive
          ]}
          onPress={audio.isPlaying ? handleStop : handlePlay}>
          <View style={styles.playButtonInner}>
            {audio.isPlaying ? (
              <View style={styles.stopIcon} />
            ) : (
              <Text style={styles.playButtonText}>▶</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Volume Slider - Bottom with Glassmorphism */}
      <View style={styles.volumeContainer}>
        <View style={[styles.glassContainer, {
          backgroundColor: `rgba(255, 255, 255, ${0.1 * (1 - audio.uiDimness * 0.85)})`,
          borderColor: `rgba(255, 255, 255, ${0.2 * (1 - audio.uiDimness * 0.85)})`,
        }]}>
          <View style={styles.volumeContent}>
            <Text style={[styles.volumeLabel, { color: `rgba(255, 255, 255, ${0.7 * (1 - audio.uiDimness * 0.85)})` }]}>Volume</Text>
            <Text style={styles.volumeValue}>{Math.round(audio.volume * 100)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            value={audio.volume}
            onValueChange={audio.setVolume}
            minimumTrackTintColor="rgba(255, 215, 0, 0.9)"
            maximumTrackTintColor={`rgba(255, 255, 255, ${0.3 * (1 - audio.uiDimness * 0.85)})`}
            thumbTintColor="gold"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  dotGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    width: 10,
    height: 10,
    margin: _circleBoxSize / 2 - 5,
    borderRadius: 10,
    backgroundColor: 'gold',
  },
  settingsButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsIcon: {
    fontSize: 24,
  },
  // Mode Selector Glassmorphism
  modeSelectorContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 5,
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modeButtonTextActive: {
    color: 'gold',
  },
  // Options Container (Presets/Noise Types)
  optionsContainer: {
    position: 'absolute',
    top: 210,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  optionCard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minWidth: 60,
  },
  optionCardActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  optionNameActive: {
    color: 'gold',
  },
  optionDetail: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  // Play Button Glassmorphism
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    zIndex: 5,
  },
  glassPlayButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glassPlayButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  playButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 48,
    color: 'gold',
    marginLeft: 8,
  },
  stopIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'gold',
    borderRadius: 6,
  },
  // Volume Slider Glassmorphism
  volumeContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  volumeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'gold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
