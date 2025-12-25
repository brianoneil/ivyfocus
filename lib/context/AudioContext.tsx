/**
 * Audio Context Provider
 * Provides audio engine state and controls to the app
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import audioEngine from '../audio/audioEngine';
import type { AudioMode, NoiseColor } from '../types/audio';

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

  const value: AudioContextValue = {
    mode,
    isPlaying,
    carrier,
    beat,
    noiseColor,
    volume,
    startBinaural,
    stopBinaural,
    startNoise,
    stopNoise,
    stop,
    setCarrier,
    setBeat,
    setNoiseColor,
    setVolume,
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

