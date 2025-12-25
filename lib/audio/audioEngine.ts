/**
 * Audio Engine for IvyFocus
 * Manages binaural beats and ambient noise generation using react-native-audio-api
 */

import { AudioContext } from 'react-native-audio-api';
import type {
    AudioEngineAPI,
    AudioEngineState,
    BinauralParams,
    NoiseColor,
    NoiseParams,
} from '../types/audio';

class AudioEngine implements AudioEngineAPI {
  private audioContext: AudioContext | null = null;
  
  // Binaural mode nodes
  private leftOscillator: OscillatorNode | null = null;
  private rightOscillator: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  private leftPanner: StereoPannerNode | null = null;
  private rightPanner: StereoPannerNode | null = null;
  
  // Noise mode nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseBuffers: Map<NoiseColor, AudioBuffer> = new Map();
  
  // State
  private state: AudioEngineState = {
    mode: null,
    isPlaying: false,
    binauralParams: { carrier: 400, beat: 10, volume: 0.5 },
    noiseParams: { color: 'white', volume: 0.5 },
  };

  /**
   * Initialize AudioContext (lazy initialization)
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      console.log('AudioContext initialized');
    }
  }

  /**
   * Generate noise buffer for a specific color
   */
  private generateNoiseBuffer(color: NoiseColor): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of audio
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      bufferSize,
      this.audioContext.sampleRate
    );

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    switch (color) {
      case 'white':
        this.generateWhiteNoise(leftChannel);
        this.generateWhiteNoise(rightChannel);
        break;
      case 'pink':
        this.generatePinkNoise(leftChannel);
        this.generatePinkNoise(rightChannel);
        break;
      case 'brown':
        this.generateBrownNoise(leftChannel);
        this.generateBrownNoise(rightChannel);
        break;
      case 'green':
        this.generateGreenNoise(leftChannel);
        this.generateGreenNoise(rightChannel);
        break;
    }

    return buffer;
  }

  /**
   * Generate white noise (random values)
   */
  private generateWhiteNoise(channel: Float32Array): void {
    for (let i = 0; i < channel.length; i++) {
      channel[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Generate pink noise using Paul Kellet's refined method
   */
  private generatePinkNoise(channel: Float32Array): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      channel[i] = pink * 0.11; // Scale down
    }
  }

  /**
   * Generate brown noise using Brownian motion
   */
  private generateBrownNoise(channel: Float32Array): void {
    let lastOut = 0;
    
    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1;
      channel[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = channel[i];
      channel[i] *= 3.5; // Compensate for volume drop
    }
  }

  /**
   * Generate green noise (custom filtering)
   */
  private generateGreenNoise(channel: Float32Array): void {
    // Green noise is similar to pink but with emphasis on mid frequencies
    this.generatePinkNoise(channel);
    // Apply additional filtering for green noise characteristics
    for (let i = 1; i < channel.length - 1; i++) {
      channel[i] = (channel[i - 1] + channel[i] + channel[i + 1]) / 3;
    }
  }

  /**
   * Start binaural beat playback
   */
  startBinaural(params: BinauralParams): void {
    this.stop(); // Stop any current playback
    this.initAudioContext();

    if (!this.audioContext) return;

    // Create gain node for volume control
    this.binauralGain = this.audioContext.createGain();
    this.binauralGain.gain.value = params.volume;

    // Create stereo panners for left and right channels
    this.leftPanner = this.audioContext.createStereoPanner();
    this.leftPanner.pan.value = -1; // Full left

    this.rightPanner = this.audioContext.createStereoPanner();
    this.rightPanner.pan.value = 1; // Full right

    // Create left oscillator (carrier frequency)
    this.leftOscillator = this.audioContext.createOscillator();
    this.leftOscillator.type = 'sine';
    this.leftOscillator.frequency.value = params.carrier;

    // Create right oscillator (carrier + beat frequency)
    this.rightOscillator = this.audioContext.createOscillator();
    this.rightOscillator.type = 'sine';
    this.rightOscillator.frequency.value = params.carrier + params.beat;

    // Connect audio graph: oscillator -> panner -> gain -> destination
    this.leftOscillator.connect(this.leftPanner);
    this.leftPanner.connect(this.binauralGain);

    this.rightOscillator.connect(this.rightPanner);
    this.rightPanner.connect(this.binauralGain);

    this.binauralGain.connect(this.audioContext.destination);

    // Start oscillators
    this.leftOscillator.start();
    this.rightOscillator.start();

    // Update state
    this.state.mode = 'binaural';
    this.state.isPlaying = true;
    this.state.binauralParams = params;

    console.log('Binaural beats started:', params);
  }

  /**
   * Update binaural beat parameters
   */
  updateBinaural(params: Partial<BinauralParams>): void {
    if (this.state.mode !== 'binaural' || !this.state.isPlaying) {
      console.warn('Binaural mode not active');
      return;
    }

    const newParams = { ...this.state.binauralParams, ...params };

    if (params.carrier !== undefined) {
      if (this.leftOscillator) {
        this.leftOscillator.frequency.value = params.carrier;
      }
      if (this.rightOscillator) {
        this.rightOscillator.frequency.value = params.carrier + newParams.beat;
      }
    }

    if (params.beat !== undefined) {
      if (this.rightOscillator) {
        this.rightOscillator.frequency.value = newParams.carrier + params.beat;
      }
    }

    if (params.volume !== undefined && this.binauralGain) {
      this.binauralGain.gain.value = params.volume;
    }

    this.state.binauralParams = newParams;
  }

  /**
   * Stop binaural beat playback
   */
  stopBinaural(): void {
    if (this.leftOscillator) {
      this.leftOscillator.stop();
      this.leftOscillator.disconnect();
      this.leftOscillator = null;
    }

    if (this.rightOscillator) {
      this.rightOscillator.stop();
      this.rightOscillator.disconnect();
      this.rightOscillator = null;
    }

    if (this.leftPanner) {
      this.leftPanner.disconnect();
      this.leftPanner = null;
    }

    if (this.rightPanner) {
      this.rightPanner.disconnect();
      this.rightPanner = null;
    }

    if (this.binauralGain) {
      this.binauralGain.disconnect();
      this.binauralGain = null;
    }

    if (this.state.mode === 'binaural') {
      this.state.mode = null;
      this.state.isPlaying = false;
    }

    console.log('Binaural beats stopped');
  }

  /**
   * Start noise playback
   */
  startNoise(params: NoiseParams): void {
    this.stop(); // Stop any current playback
    this.initAudioContext();

    if (!this.audioContext) return;

    // Generate or retrieve noise buffer
    if (!this.noiseBuffers.has(params.color)) {
      const buffer = this.generateNoiseBuffer(params.color);
      this.noiseBuffers.set(params.color, buffer);
    }

    const buffer = this.noiseBuffers.get(params.color)!;

    // Create gain node for volume control
    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = params.volume;

    // Create buffer source node
    this.noiseSource = this.audioContext.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    // Connect audio graph: source -> gain -> destination
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.audioContext.destination);

    // Start playback
    this.noiseSource.start();

    // Update state
    this.state.mode = 'noise';
    this.state.isPlaying = true;
    this.state.noiseParams = params;

    console.log('Noise started:', params);
  }

  /**
   * Update noise parameters
   */
  updateNoise(params: Partial<NoiseParams>): void {
    if (this.state.mode !== 'noise' || !this.state.isPlaying) {
      console.warn('Noise mode not active');
      return;
    }

    const newParams = { ...this.state.noiseParams, ...params };

    // If color changed, restart with new buffer
    if (params.color !== undefined && params.color !== this.state.noiseParams.color) {
      this.startNoise(newParams);
      return;
    }

    // Update volume
    if (params.volume !== undefined && this.noiseGain) {
      this.noiseGain.gain.value = params.volume;
    }

    this.state.noiseParams = newParams;
  }

  /**
   * Stop noise playback
   */
  stopNoise(): void {
    if (this.noiseSource) {
      this.noiseSource.stop();
      this.noiseSource.disconnect();
      this.noiseSource = null;
    }

    if (this.noiseGain) {
      this.noiseGain.disconnect();
      this.noiseGain = null;
    }

    if (this.state.mode === 'noise') {
      this.state.mode = null;
      this.state.isPlaying = false;
    }

    console.log('Noise stopped');
  }

  /**
   * Stop all playback
   */
  stop(): void {
    this.stopBinaural();
    this.stopNoise();
  }

  /**
   * Get current engine state
   */
  getState(): AudioEngineState {
    return { ...this.state };
  }
}

export default new AudioEngine();

