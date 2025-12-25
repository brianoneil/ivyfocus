# IvyFocus - Audio Focus App Requirements

## 1. Platform & Architecture

### Technology Stack
- **Framework**: React Native + Expo (managed workflow)
- **Build System**: Expo prebuild to generate native iOS/Android projects
- **Language**: TypeScript for all app code
- **Routing**: Expo Router (default Expo tooling)
- **Builds & Updates**: Expo's default tooling for builds and OTA updates

### Audio Stack
- **Core Library**: [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api)
  - Context7 Documentation: `/software-mansion/react-native-audio-api`
  - High-performance audio engine compatible with Web Audio API specification
  - Provides AudioContext, OscillatorNode, AudioBuffer, GainNode, and other audio processing nodes
  - Supports background audio playback and audio session management

### Setup & Installation

#### Prerequisites
- Node.js (v18+ recommended)
- Expo CLI or Expo Go app
- iOS Simulator (for macOS) or Android Emulator
- Physical device recommended for audio testing

#### Installation Steps
```bash
# Install react-native-audio-api
npm install react-native-audio-api

# For Expo managed workflow, you may need to run:
npx expo prebuild

# Install additional UI dependencies
npm install @react-native-community/slider
```

#### Expo Configuration
- Ensure `newArchEnabled: true` in `app.json` (already configured)
- Audio session configuration will be handled via `AudioManager` from react-native-audio-api

#### Key Documentation References
- [AudioContext Setup](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/core/audio-context.mdx)
- [OscillatorNode API](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/sources/oscillator-node.mdx)
- [AudioBuffer & Noise Generation](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/guides/noise-generation.mdx)
- [AudioManager for Session Control](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/system/audio-manager.mdx)

---

## 2. Audio Modes

### 2.1 Binaural Mode (Headphones Required)

#### Implementation
- Use two `OscillatorNode` instances from react-native-audio-api:
  - **Left channel**: Carrier frequency (200–600 Hz range)
  - **Right channel**: Carrier frequency + beat frequency (+4–20 Hz)
- Control via React state (hooks) and pass parameters to the audio engine
- Use `GainNode` for per-channel and master volume control

#### UI Requirements
- Clear text stating: **"Headphones recommended/required"**
- Sliders for:
  - Carrier frequency (200–600 Hz)
  - Beat frequency (4–20 Hz)
  - Volume (0–100%)

#### Technical Details
- Create separate oscillator nodes for left and right channels
- Connect each oscillator to its own gain node
- Route left/right channels to stereo output
- Use `AudioContext.createOscillator()` for each channel
- Reference: [OscillatorNode Example](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/sources/oscillator-node.mdx)

### 2.2 Ambient Noise Mode (Speakers/Headphones)

#### Implementation
- Generate noise using `AudioContext` + `AudioBuffer` from react-native-audio-api
- **White noise**: Fill `Float32Array` with random values, loop the buffer
- **Pink/Brown/Green noise**: Shape white noise using filters or known noise-color algorithms
- Use `AudioBufferSourceNode` with looping enabled for continuous playback

#### Noise Types
- **White**: Random values across all frequencies
- **Pink**: -3dB/octave filter (Paul Kellet's refined method)
- **Brown**: Brownian motion algorithm
- **Green**: Custom filtering (optional)

#### UI Requirements
- Segmented control or radio buttons for noise type selection (White / Pink / Brown / Green)
- Volume slider (0–100%)
- Session duration controls (optional)

#### Technical Details
- Create noise buffers using `AudioContext.createBuffer()`
- Use `Float32Array` to fill buffer data
- Reference: [Noise Generation Guide](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/guides/noise-generation.mdx)

---

## 3. Audio Engine Layer

### Module: `audioEngine.ts`

#### Initialization
- Initialize a single `AudioContext` instance on app startup
- Store in a singleton or context provider
- Configure sample rate (default: 44100 Hz, range: 8000–96000 Hz)

#### API Functions

##### Binaural Functions
```typescript
startBinaural({ carrier: number, beat: number, volume: number }): void
updateBinaural({ carrier?: number, beat?: number, volume?: number }): void
stopBinaural(): void
```

##### Noise Functions
```typescript
startNoise({ color: 'white' | 'pink' | 'brown' | 'green', volume: number }): void
updateNoise({ color?: string, volume?: number }): void
stopNoise(): void
```

#### Internal Management
- **Oscillator nodes**: For left/right channels in binaural mode
- **Noise buffers**: Pre-generated AudioBuffer instances for each noise type
- **Buffer source nodes**: For playing looped noise buffers
- **Gain nodes**: Per-mode volume control and master volume
- **Audio routing**: Proper connection of nodes to `AudioContext.destination`

#### Implementation Notes
- Use `useRef` to maintain audio context and node references
- Clean up nodes when stopping playback
- Handle audio context state (suspended/resumed)
- Reference: [AudioContext Creation](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/guides/lets-make-some-noise.mdx)

---

## 4. UI, State, and Navigation

### Navigation
- Use Expo Router (already configured) for screen structure
- Main screen: Audio player with mode selection
- Settings/About screen: Disclaimer and volume warnings

### State Management
Use React hooks + Context (or Zustand if desired) to manage:

- `mode`: `'binaural' | 'noise'`
- `carrier`: number (200–600 Hz)
- `beat`: number (4–20 Hz)
- `noiseColor`: `'white' | 'pink' | 'brown' | 'green'`
- `volume`: number (0–1)
- `isPlaying`: boolean
- `sessionDuration`: number (optional, in seconds)

### UI Components

#### Required Components
- **Sliders**: Use `@react-native-community/slider` for:
  - Frequencies (carrier, beat)
  - Volume control
- **Mode Selection**: Segmented control or radio buttons for:
  - Mode selection (Binaural vs Noise)
  - Noise type selection (White/Pink/Brown/Green)
- **Playback Controls**:
  - Primary "Play / Stop" button
  - Optional preset buttons for common configurations

#### Component Structure
- Keep components discrete and in separate files
- Create reusable slider components
- Separate mode selection UI from playback controls

---

## 5. App Behavior & OS Integration

### Audio Session Configuration
- Configure audio category via `AudioManager` from react-native-audio-api
- Set iOS audio session options:
  ```typescript
  AudioManager.setAudioSessionOptions({
    iosCategory: 'playback',
    iosMode: 'default',
    iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP'],
  })
  ```
- Enable background playback if desired (or stop on background for simplicity)

### Audio Focus Handling
- Handle audio interruptions via `AudioManager.observeAudioInterruptions(true)`
- Listen for interruption events and pause/duck audio accordingly
- Use `AudioManager.addSystemEventListener('interruption', callback)` for handling

### Session Timers
- Implement session timers in JavaScript
- Tie timers to `stopBinaural()` / `stopNoise()` to end playback cleanly
- Optional: Display countdown timer in UI

### Lock Screen Integration
- Set lock screen info via `AudioManager.setLockScreenInfo()`
- Enable remote commands for play/pause if desired

#### Reference
- [AudioManager Documentation](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/system/audio-manager.mdx)

---

## 6. Safety, Content, and Copy

### Content Guidelines
- **Avoid medical/clinical claims**
- Use neutral wording:
  - "supports focus"
  - "masks distractions"
  - "ambient sound for concentration"

### Required Disclaimers
- **Settings/About Screen**: Short disclaimer about audio therapy and safety
- **Volume Warning**: Display warning text:
  - "Keep volume at a comfortable level, especially with headphones"
  - Consider showing on first launch or in settings

### Safety Considerations
- Implement maximum volume limits if needed
- Warn users about extended headphone use
- Provide clear instructions for binaural mode (headphones required)

---

## 7. Implementation Plan

### Phase 1: Setup & Core Engine
1. Install dependencies (`react-native-audio-api`, `@react-native-community/slider`)
2. Create `audioEngine.ts` module with AudioContext initialization
3. Implement basic AudioContext singleton pattern
4. Test audio context creation and basic playback

### Phase 2: Binaural Mode
1. Implement `startBinaural()`, `updateBinaural()`, `stopBinaural()`
2. Create dual oscillator setup (left/right channels)
3. Add gain nodes for volume control
4. Test with headphones

### Phase 3: Noise Mode
1. Implement noise buffer generation functions (white, pink, brown, green)
2. Create `startNoise()`, `updateNoise()`, `stopNoise()`
3. Implement looping AudioBufferSourceNode
4. Test each noise type

### Phase 4: UI Components
1. Create slider components for frequencies and volume
2. Build mode selection UI (segmented control)
3. Implement play/stop button
4. Add noise type selector

### Phase 5: State Management
1. Create audio context provider or Zustand store
2. Connect UI components to audio engine
3. Implement state updates for all controls

### Phase 6: OS Integration
1. Configure AudioManager for audio session
2. Implement interruption handling
3. Add lock screen info (optional)
4. Test background playback behavior

### Phase 7: Polish & Safety
1. Add disclaimers and warnings
2. Implement session timers (optional)
3. Add preset configurations (optional)
4. Final testing and refinement

---

## 8. Additional Resources

### Documentation Links
- [React Native Audio API - Main Docs](https://github.com/software-mansion/react-native-audio-api)
- [Context7 Library Reference](/software-mansion/react-native-audio-api)
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/) (for reference, as react-native-audio-api follows this spec)

### Example Code References
- [Making Noise Guide](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/guides/lets-make-some-noise.mdx)
- [Noise Generation Examples](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/guides/noise-generation.mdx)
- [Oscillator Examples](https://github.com/software-mansion/react-native-audio-api/blob/main/packages/audiodocs/docs/sources/oscillator-node.mdx)

### Testing Considerations
- Test on physical devices (audio quality varies on simulators)
- Test with different headphone types for binaural mode
- Verify background playback behavior
- Test audio interruption scenarios (incoming calls, other apps)
