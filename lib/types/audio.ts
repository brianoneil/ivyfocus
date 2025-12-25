/**
 * Audio Engine Types
 * Type definitions for the IvyFocus audio engine
 */

export type NoiseColor = 'white' | 'pink' | 'brown' | 'green';

export type NaturalSound = 'none' | 'wind' | 'rain' | 'ocean';

export type AudioMode = 'binaural' | 'noise';

export interface BinauralParams {
  carrier: number;  // 200-600 Hz
  beat: number;     // 4-20 Hz
  volume: number;   // 0-1
}

export interface NoiseParams {
  color: NoiseColor;
  volume: number;   // 0-1
  naturalSound: NaturalSound;
  naturalSoundVolume: number; // 0-1, volume of natural sound layer
}

export interface AudioEngineState {
  mode: AudioMode | null;
  isPlaying: boolean;
  binauralParams: BinauralParams;
  noiseParams: NoiseParams;
}

export interface AudioEngineAPI {
  // Binaural functions
  startBinaural(params: BinauralParams): void;
  updateBinaural(params: Partial<BinauralParams>): void;
  stopBinaural(): void;
  
  // Noise functions
  startNoise(params: NoiseParams): void;
  updateNoise(params: Partial<NoiseParams>): void;
  stopNoise(): void;
  
  // General functions
  stop(): void;
  getState(): AudioEngineState;
}

