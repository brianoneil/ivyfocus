import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FrequencySlider } from '../components/FrequencySlider';
import { ModeSelector } from '../components/ModeSelector';
import { NoiseTypeSelector } from '../components/NoiseTypeSelector';
import { PlaybackControls } from '../components/PlaybackControls';
import { VolumeSlider } from '../components/VolumeSlider';
import { useAudio } from '../lib/context/AudioContext';
import type { AudioMode } from '../lib/types/audio';

export default function Index() {
  const audio = useAudio();
  const [selectedMode, setSelectedMode] = useState<AudioMode>('binaural');

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🎧 IvyFocus</Text>
          <Text style={styles.subtitle}>Audio Focus & Concentration</Text>
        </View>

        <ModeSelector
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          disabled={audio.isPlaying}
        />

        {selectedMode === 'binaural' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Binaural Beats</Text>
              <Text style={styles.headphonesWarning}>🎧 Headphones Required</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Binaural beats support focus by playing slightly different frequencies in each ear,
              creating a perceived beat frequency that may help with concentration.
            </Text>

            <FrequencySlider
              label="Carrier Frequency"
              value={audio.carrier}
              min={200}
              max={600}
              step={10}
              unit="Hz"
              onValueChange={audio.setCarrier}
            />

            <FrequencySlider
              label="Beat Frequency"
              value={audio.beat}
              min={4}
              max={20}
              step={1}
              unit="Hz"
              onValueChange={audio.setBeat}
            />
          </View>
        )}

        {selectedMode === 'noise' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ambient Noise</Text>
            <Text style={styles.sectionDescription}>
              Ambient noise masks distractions and creates a consistent sound environment for
              concentration.
            </Text>

            <NoiseTypeSelector
              selectedColor={audio.noiseColor}
              onColorChange={audio.setNoiseColor}
              disabled={audio.isPlaying}
            />
          </View>
        )}

        <VolumeSlider value={audio.volume} onValueChange={audio.setVolume} />

        <PlaybackControls
          isPlaying={audio.isPlaying}
          onPlay={handlePlay}
          onStop={handleStop}
        />

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            ⚠️ This app is for focus and concentration support only. It is not intended for
            medical or therapeutic use. Keep volume at comfortable levels.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  headphonesWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  footer: {
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
