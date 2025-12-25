/**
 * Audio Context Provider
 * Provides audio engine state and controls to the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import audioEngine from '../audio/audioEngine';
import type { AudioMode, NoiseColor } from '../types/audio';

// Storage keys
const STORAGE_KEYS = {
  CARRIER: '@ivyfocus_carrier',
  BEAT: '@ivyfocus_beat',
  NOISE_COLOR: '@ivyfocus_noise_color',
  VOLUME: '@ivyfocus_volume',
  UI_DIMNESS: '@ivyfocus_ui_dimness',
  BACKGROUND_TYPE: '@ivyfocus_background_type',
};

export type BackgroundType = 'dots' | 'lava';

interface AudioContextValue {
  // State
  mode: AudioMode | null;
  isPlaying: boolean;

  // Binaural parameters
  carrier: number;
  beat: number;

  // Noise parameters
  noiseColor: NoiseColor;

  // Common
  volume: number;

  // UI settings
  uiDimness: number; // 0 = bright, 1 = very dim
  backgroundType: BackgroundType;

  // Controls
  startBinaural: () => void;
  stopBinaural: () => void;
  startNoise: () => void;
  stopNoise: () => void;
  stop: () => void;

  // Parameter updates
  setCarrier: (value: number) => void;
  setBeat: (value: number) => void;
  setNoiseColor: (value: NoiseColor) => void;
  setVolume: (value: number) => void;
  setUiDimness: (value: number) => void;
  setBackgroundType: (value: BackgroundType) => void;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AudioMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Binaural state
  const [carrier, setCarrierState] = useState(400); // 200-600 Hz
  const [beat, setBeatState] = useState(10); // 4-20 Hz
  
  // Noise state
  const [noiseColor, setNoiseColorState] = useState<NoiseColor>('white');

  // Common state
  const [volume, setVolumeState] = useState(0.5); // 0-1

  // UI state
  const [uiDimness, setUiDimnessState] = useState(0.3); // 0-1, default moderate dimming
  const [backgroundType, setBackgroundTypeState] = useState<BackgroundType>('dots');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedCarrier, savedBeat, savedNoiseColor, savedVolume, savedUiDimness, savedBackgroundType] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CARRIER),
          AsyncStorage.getItem(STORAGE_KEYS.BEAT),
          AsyncStorage.getItem(STORAGE_KEYS.NOISE_COLOR),
          AsyncStorage.getItem(STORAGE_KEYS.VOLUME),
          AsyncStorage.getItem(STORAGE_KEYS.UI_DIMNESS),
          AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_TYPE),
        ]);

        if (savedCarrier) setCarrierState(parseFloat(savedCarrier));
        if (savedBeat) setBeatState(parseFloat(savedBeat));
        if (savedNoiseColor) setNoiseColorState(savedNoiseColor as NoiseColor);
        if (savedVolume) setVolumeState(parseFloat(savedVolume));
        if (savedUiDimness) setUiDimnessState(parseFloat(savedUiDimness));
        if (savedBackgroundType) setBackgroundTypeState(savedBackgroundType as BackgroundType);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save carrier frequency when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.CARRIER, carrier.toString());
    }
  }, [carrier, isLoaded]);

  // Save beat frequency when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.BEAT, beat.toString());
    }
  }, [beat, isLoaded]);

  // Save noise color when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.NOISE_COLOR, noiseColor);
    }
  }, [noiseColor, isLoaded]);

  // Save volume when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    }
  }, [volume, isLoaded]);

  // Save UI dimness when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.UI_DIMNESS, uiDimness.toString());
    }
  }, [uiDimness, isLoaded]);

  // Save background type when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_TYPE, backgroundType);
    }
  }, [backgroundType, isLoaded]);

  const startBinaural = useCallback(() => {
    audioEngine.startBinaural({ carrier, beat, volume });
    setMode('binaural');
    setIsPlaying(true);
  }, [carrier, beat, volume]);

  const stopBinaural = useCallback(() => {
    audioEngine.stopBinaural();
    setMode(null);
    setIsPlaying(false);
  }, []);

  const startNoise = useCallback(() => {
    audioEngine.startNoise({ color: noiseColor, volume });
    setMode('noise');
    setIsPlaying(true);
  }, [noiseColor, volume]);

  const stopNoise = useCallback(() => {
    audioEngine.stopNoise();
    setMode(null);
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    audioEngine.stop();
    setMode(null);
    setIsPlaying(false);
  }, []);

  const setCarrier = useCallback((value: number) => {
    setCarrierState(value);
    if (mode === 'binaural' && isPlaying) {
      audioEngine.updateBinaural({ carrier: value });
    }
  }, [mode, isPlaying]);

  const setBeat = useCallback((value: number) => {
    setBeatState(value);
    if (mode === 'binaural' && isPlaying) {
      audioEngine.updateBinaural({ beat: value });
    }
  }, [mode, isPlaying]);

  const setNoiseColor = useCallback((value: NoiseColor) => {
    setNoiseColorState(value);
    if (mode === 'noise' && isPlaying) {
      audioEngine.updateNoise({ color: value });
    }
  }, [mode, isPlaying]);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (isPlaying) {
      if (mode === 'binaural') {
        audioEngine.updateBinaural({ volume: value });
      } else if (mode === 'noise') {
        audioEngine.updateNoise({ volume: value });
      }
    }
  }, [mode, isPlaying]);

  const setUiDimness = useCallback((value: number) => {
    setUiDimnessState(value);
  }, []);

  const setBackgroundType = useCallback((value: BackgroundType) => {
    setBackgroundTypeState(value);
  }, []);

  const value: AudioContextValue = {
    mode,
    isPlaying,
    carrier,
    beat,
    noiseColor,
    volume,
    uiDimness,
    backgroundType,
    startBinaural,
    stopBinaural,
    startNoise,
    stopNoise,
    stop,
    setCarrier,
    setBeat,
    setNoiseColor,
    setVolume,
    setUiDimness,
    setBackgroundType,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

