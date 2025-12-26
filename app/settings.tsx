import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FrequencySlider } from '../components/FrequencySlider';
import { NoiseTypeSelector } from '../components/NoiseTypeSelector';
import { useAudio } from '../lib/context/AudioContext';

export default function Settings() {
  const router = useRouter();
  const audio = useAudio();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Settings Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Binaural Settings */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Image
                source={require('../assets/images/ui-icons/binaural-icon.png')}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Binaural Beat Settings</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Adjust the carrier and beat frequencies for binaural mode. These settings apply when
              you select Binaural mode on the main screen.
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

            <View style={styles.presetsContainer}>
              <Text style={styles.presetsTitle}>Frequency Presets:</Text>
              <View style={styles.presetsGrid}>
                {/* Theta Preset */}
                <TouchableOpacity
                  style={[styles.presetCard, audio.beat >= 4 && audio.beat <= 7 && styles.presetCardActive]}
                  onPress={() => audio.setBeat(6)}>
                  <Text style={styles.presetName}>Theta</Text>
                  <Text style={styles.presetFreq}>6 Hz</Text>
                  <Text style={styles.presetDesc}>Deep Relaxation</Text>
                </TouchableOpacity>

                {/* Alpha Preset */}
                <TouchableOpacity
                  style={[styles.presetCard, audio.beat >= 8 && audio.beat <= 13 && styles.presetCardActive]}
                  onPress={() => audio.setBeat(10)}>
                  <Text style={styles.presetName}>Alpha</Text>
                  <Text style={styles.presetFreq}>10 Hz</Text>
                  <Text style={styles.presetDesc}>Calm Focus</Text>
                </TouchableOpacity>

                {/* Beta Preset */}
                <TouchableOpacity
                  style={[styles.presetCard, audio.beat >= 14 && audio.beat <= 20 && styles.presetCardActive]}
                  onPress={() => audio.setBeat(16)}>
                  <Text style={styles.presetName}>Beta</Text>
                  <Text style={styles.presetFreq}>16 Hz</Text>
                  <Text style={styles.presetDesc}>Active Focus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Noise Settings */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Image
                source={require('../assets/images/ui-icons/noise-icon.png')}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Noise Type Settings</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose your preferred ambient noise type. Each color has different frequency
              characteristics.
            </Text>

            <NoiseTypeSelector
              selectedColor={audio.noiseColor}
              onColorChange={audio.setNoiseColor}
              disabled={audio.isPlaying && audio.mode === 'noise'}
            />
          </View>

          {/* UI Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UI Settings</Text>
            <Text style={styles.sectionDescription}>
              Adjust the visibility of the UI elements on the main screen.
            </Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>UI Dimness</Text>
                <Text style={styles.sliderValue}>{Math.round(audio.uiDimness * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={audio.uiDimness}
                onValueChange={audio.setUiDimness}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#DDD"
                thumbTintColor="#FFD700"
              />
              <Text style={styles.sliderDescription}>
                Higher values make the UI more subtle and less distracting
              </Text>
            </View>

            <View style={styles.backgroundTypeContainer}>
              <Text style={styles.sliderLabel}>Background Type</Text>
              <View style={styles.backgroundTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.backgroundTypeButton,
                    audio.backgroundType === 'dots' && styles.backgroundTypeButtonActive
                  ]}
                  onPress={() => audio.setBackgroundType('dots')}>
                  <Text style={[
                    styles.backgroundTypeButtonText,
                    audio.backgroundType === 'dots' && styles.backgroundTypeButtonTextActive
                  ]}>
                    Dots
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.backgroundTypeButton,
                    audio.backgroundType === 'lava' && styles.backgroundTypeButtonActive
                  ]}
                  onPress={() => audio.setBackgroundType('lava')}>
                  <Text style={[
                    styles.backgroundTypeButtonText,
                    audio.backgroundType === 'lava' && styles.backgroundTypeButtonTextActive
                  ]}>
                    Lava Lamp
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sliderDescription}>
                Choose between animated dots or lava lamp background
              </Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About IvyFocus</Text>
            <View style={styles.aboutBox}>
              <Text style={styles.aboutText}>
                IvyFocus is an audio focus tool designed to help with concentration and
                productivity.
              </Text>
              <Text style={styles.aboutText}>
                {'\n'}
                <Text style={styles.aboutBold}>Binaural Beats:</Text> Play slightly different
                frequencies in each ear to create a perceived beat frequency. Requires headphones.
              </Text>
              <Text style={styles.aboutText}>
                {'\n'}
                <Text style={styles.aboutBold}>Ambient Noise:</Text> Masks distractions with
                consistent background sound.
              </Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>⚠️ Important Safety Information</Text>
            <Text style={styles.disclaimerText}>
              • This app is for focus and concentration support only{'\n'}
              • Not intended for medical or therapeutic use{'\n'}
              • Keep volume at comfortable levels{'\n'}
              • Take breaks regularly{'\n'}
              • Discontinue use if you experience discomfort
            </Text>
          </View>
        </ScrollView>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  sliderContainer: {
    marginVertical: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  backgroundTypeContainer: {
    marginTop: 20,
  },
  backgroundTypeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  backgroundTypeButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  backgroundTypeButtonActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
  },
  backgroundTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  backgroundTypeButtonTextActive: {
    color: '#000',
  },
  presetsContainer: {
    marginTop: 20,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFD700',
  },
  presetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  presetFreq: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  presetDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  aboutBox: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  aboutBold: {
    fontWeight: '600',
    color: '#000',
  },
  disclaimerBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5B4',
    marginBottom: 40,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
