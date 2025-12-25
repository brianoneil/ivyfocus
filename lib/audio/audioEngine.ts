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
    NoiseParams
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

  // Natural sound nodes
  private naturalSoundSource: AudioBufferSourceNode | null = null;
  private naturalSoundGain: GainNode | null = null;
  private naturalSoundFilter: BiquadFilterNode | null = null;
  private naturalSoundLFO: OscillatorNode | null = null;
  private naturalSoundLFOGain: GainNode | null = null;
  private naturalSoundBuffers: Map<NaturalSound, AudioBuffer> = new Map();

  // Mixer for layering noise + natural sounds
  private mixer: GainNode | null = null;

  // State
  private state: AudioEngineState = {
    mode: null,
    isPlaying: false,
    binauralParams: { carrier: 400, beat: 10, volume: 0.5 },
    noiseParams: { color: 'white', volume: 0.5, naturalSound: 'none', naturalSoundVolume: 0.8 },
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
   * Generate natural sound buffer
   */
  private generateNaturalSoundBuffer(sound: NaturalSound): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const bufferSize = this.audioContext.sampleRate * 4; // 4 seconds of audio
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      bufferSize,
      this.audioContext.sampleRate
    );

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    switch (sound) {
      case 'wind':
        this.generateWindSound(leftChannel);
        this.generateWindSound(rightChannel);
        break;
      case 'rain':
        this.generateRainSound(leftChannel);
        this.generateRainSound(rightChannel);
        break;
      case 'ocean':
        this.generateOceanSound(leftChannel);
        this.generateOceanSound(rightChannel);
        break;
      case 'none':
        // Silent buffer
        break;
    }

    return buffer;
  }

  /**
   * Generate wind sound: filtered noise with slow modulation
   */
  private generateWindSound(channel: Float32Array): void {
    // Start with white noise and apply band-pass filtering manually
    // Also add slow amplitude modulation for gusts
    const gustFreq = 0.15; // Slightly faster modulation for more noticeable gusts
    const sampleRate = channel.length / 4; // 4 seconds

    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1;
      const time = i / sampleRate;

      // More dramatic amplitude modulation for gusts (0.3 to 1.0)
      const gustMod = 0.3 + 0.7 * Math.sin(2 * Math.PI * gustFreq * time);

      // Apply simple low-pass filtering for wind character
      if (i > 0) {
        channel[i] = (white * 0.3 + channel[i - 1] * 0.7) * gustMod * 1.2; // Boosted from 0.6 to 1.2
      } else {
        channel[i] = white * gustMod * 1.2;
      }
    }
  }

  /**
   * Generate rain sound: filtered noise + random droplet bursts
   */
  private generateRainSound(channel: Float32Array): void {
    // Base: high-passed noise for rain ambience
    this.generateWhiteNoise(channel);

    // Apply high-pass filtering (simple)
    for (let i = channel.length - 1; i > 0; i--) {
      channel[i] = channel[i] - channel[i - 1] * 0.95;
    }

    // Scale down base rain but keep it audible
    for (let i = 0; i < channel.length; i++) {
      channel[i] *= 0.5; // Boosted from 0.3 to 0.5
    }

    // Add random droplet bursts - more dense and louder
    const dropletDensity = 0.04; // Increased from 2% to 4% for more rain
    for (let i = 0; i < channel.length; i++) {
      if (Math.random() < dropletDensity) {
        // Short burst envelope
        const burstLength = Math.floor(Math.random() * 50 + 20);
        for (let j = 0; j < burstLength && i + j < channel.length; j++) {
          const envelope = Math.exp(-j / 10); // Quick decay
          channel[i + j] += (Math.random() * 2 - 1) * envelope * 0.8; // Boosted from 0.4 to 0.8
        }
      }
    }
  }

  /**
   * Generate ocean surf sound: low-passed noise with very slow sweeps
   */
  private generateOceanSound(channel: Float32Array): void {
    // Start with brown noise (already low-frequency heavy)
    this.generateBrownNoise(channel);

    // Layer multiple wave frequencies for more natural, varied ocean sound
    // All frequencies chosen to complete full cycles in 4 seconds for seamless looping
    const sampleRate = channel.length / 4; // 4 seconds

    for (let i = 0; i < channel.length; i++) {
      const time = i / sampleRate;

      // Layer 3 different wave frequencies for complexity:
      // - Slow swell (0.125 Hz = 8 second period, half cycle in 4 sec)
      // - Main waves (0.25 Hz = 4 second period, 1 full cycle)
      // - Small ripples (0.5 Hz = 2 second period, 2 full cycles)
      const slowSwell = 0.15 * Math.sin(2 * Math.PI * 0.125 * time);
      const mainWave = 0.25 * Math.sin(2 * Math.PI * 0.25 * time);
      const ripples = 0.1 * Math.sin(2 * Math.PI * 0.5 * time + 0.5); // Phase offset for variety

      // Combine waves with a higher base level (0.5) and moderate variation (0.5)
      // This keeps the ocean sound more consistent, ranging from ~0.5 to ~1.0
      const waveMod = 0.5 + 0.5 * (slowSwell + mainWave + ripples);

      // Clamp to reasonable range
      const clampedMod = Math.max(0.4, Math.min(1.0, waveMod));

      channel[i] *= clampedMod * 0.9;
    }

    // Apply crossfade at loop boundaries for extra smoothness
    const crossfadeSamples = Math.floor(channel.length * 0.05); // 5% crossfade

    // Fade in at the start
    for (let i = 0; i < crossfadeSamples; i++) {
      const fadeIn = i / crossfadeSamples;
      channel[i] *= fadeIn;
    }

    // Fade out at the end
    for (let i = channel.length - crossfadeSamples; i < channel.length; i++) {
      const fadeOut = (channel.length - i) / crossfadeSamples;
      channel[i] *= fadeOut;
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
   * Start noise playback (with optional natural sound layer)
   */
  startNoise(params: NoiseParams): void {
    this.stop(); // Stop any current playback
    this.initAudioContext();

    if (!this.audioContext) return;

    // Create mixer for layering
    this.mixer = this.audioContext.createGain();
    this.mixer.gain.value = 1.0;
    this.mixer.connect(this.audioContext.destination);

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

    // Connect audio graph: source -> gain -> mixer
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.mixer);

    // Start playback
    this.noiseSource.start();

    // Add natural sound layer if enabled
    if (params.naturalSound !== 'none') {
      this.startNaturalSound(params.naturalSound, params.naturalSoundVolume);
    }

    // Update state
    this.state.mode = 'noise';
    this.state.isPlaying = true;
    this.state.noiseParams = params;

    console.log('Noise started:', params);
  }

  /**
   * Start natural sound layer
   */
  private startNaturalSound(sound: NaturalSound, volume: number): void {
    if (!this.audioContext || !this.mixer || sound === 'none') return;

    // Generate or retrieve natural sound buffer
    if (!this.naturalSoundBuffers.has(sound)) {
      const buffer = this.generateNaturalSoundBuffer(sound);
      this.naturalSoundBuffers.set(sound, buffer);
    }

    const buffer = this.naturalSoundBuffers.get(sound)!;

    // Create gain node for volume control
    this.naturalSoundGain = this.audioContext.createGain();
    this.naturalSoundGain.gain.value = volume;

    // Create buffer source node
    this.naturalSoundSource = this.audioContext.createBufferSource();
    this.naturalSoundSource.buffer = buffer;
    this.naturalSoundSource.loop = true;

    // Connect: source -> gain -> mixer
    this.naturalSoundSource.connect(this.naturalSoundGain);
    this.naturalSoundGain.connect(this.mixer);

    // Start playback
    this.naturalSoundSource.start();

    console.log('Natural sound started:', sound);
  }

  /**
   * Stop natural sound layer
   */
  private stopNaturalSound(): void {
    if (this.naturalSoundSource) {
      this.naturalSoundSource.stop();
      this.naturalSoundSource.disconnect();
      this.naturalSoundSource = null;
    }

    if (this.naturalSoundGain) {
      this.naturalSoundGain.disconnect();
      this.naturalSoundGain = null;
    }

    if (this.naturalSoundFilter) {
      this.naturalSoundFilter.disconnect();
      this.naturalSoundFilter = null;
    }

    if (this.naturalSoundLFO) {
      this.naturalSoundLFO.stop();
      this.naturalSoundLFO.disconnect();
      this.naturalSoundLFO = null;
    }

    if (this.naturalSoundLFOGain) {
      this.naturalSoundLFOGain.disconnect();
      this.naturalSoundLFOGain = null;
    }
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

    // If natural sound changed, restart natural sound layer
    if (params.naturalSound !== undefined && params.naturalSound !== this.state.noiseParams.naturalSound) {
      this.stopNaturalSound();
      if (params.naturalSound !== 'none') {
        this.startNaturalSound(params.naturalSound, newParams.naturalSoundVolume);
      }
    }

    // Update volume
    if (params.volume !== undefined && this.noiseGain) {
      this.noiseGain.gain.value = params.volume;
    }

    // Update natural sound volume
    if (params.naturalSoundVolume !== undefined && this.naturalSoundGain) {
      this.naturalSoundGain.gain.value = params.naturalSoundVolume;
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

    // Stop natural sound layer
    this.stopNaturalSound();

    // Disconnect mixer
    if (this.mixer) {
      this.mixer.disconnect();
      this.mixer = null;
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

