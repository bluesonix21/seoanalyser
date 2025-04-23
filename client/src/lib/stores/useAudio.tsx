import { create } from "zustand";
import { Howl, Howler } from "howler";

type SoundType = "ui" | "notification" | "alert" | "success" | "error";

interface Sound {
  id: string;
  type: SoundType;
  howl: Howl;
}

interface AudioState {
  volume: number;
  muted: boolean;
  sounds: Record<string, Sound>;
  playing: string[];
  isInitialized: boolean;
  
  // Methods
  initializeAudio: () => Promise<void>;
  playSound: (soundId: string) => void;
  stopSound: (soundId: string) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

// UI Sound effects
const UI_SOUNDS = {
  click: "/sounds/click.mp3",
  hover: "/sounds/hover.mp3",
  switch: "/sounds/switch.mp3",
  notification: "/sounds/notification.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  warning: "/sounds/warning.mp3",
};

export const useAudio = create<AudioState>((set, get) => ({
  volume: 0.5,
  muted: false,
  sounds: {},
  playing: [],
  isInitialized: false,
  
  // Initialize Audio
  initializeAudio: async () => {
    // Set global howler settings
    Howler.volume(get().volume);
    
    try {
      // Load all sounds
      const soundPromises = Object.entries(UI_SOUNDS).map(([id, src]) => {
        return new Promise<Sound>((resolve) => {
          const type = id.includes("notification") || id.includes("success") || id.includes("error") || id.includes("warning")
            ? (id as SoundType)
            : "ui";
          
          const howl = new Howl({
            src: [src],
            autoplay: false,
            loop: false,
            volume: get().volume,
            onload: () => {
              resolve({ id, type, howl });
            },
            onloaderror: (_, error) => {
              console.error(`Failed to load sound ${id}:`, error);
              // Resolve anyway to prevent blocking initialization
              resolve({ id, type, howl });
            },
          });
        });
      });
      
      // Load all sounds in parallel
      const loadedSounds = await Promise.all(soundPromises);
      
      // Create sounds object
      const sounds: Record<string, Sound> = {};
      loadedSounds.forEach((sound) => {
        sounds[sound.id] = sound;
      });
      
      // Update state
      set({
        sounds,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  },
  
  // Play a sound
  playSound: (soundId: string) => {
    const { sounds, muted, playing } = get();
    
    if (muted || !sounds[soundId]) return;
    
    const sound = sounds[soundId];
    const playingId = sound.howl.play();
    
    // Add to playing list
    set({ playing: [...playing, soundId] });
    
    // Remove from playing list when done
    sound.howl.once("end", () => {
      set((state) => ({
        playing: state.playing.filter((id) => id !== soundId),
      }));
    });
    
    return playingId;
  },
  
  // Stop a sound
  stopSound: (soundId: string) => {
    const { sounds, playing } = get();
    
    if (!sounds[soundId]) return;
    
    sounds[soundId].howl.stop();
    
    // Remove from playing list
    set({
      playing: playing.filter((id) => id !== soundId),
    });
  },
  
  // Change volume
  setVolume: (volume: number) => {
    // Update global volume
    Howler.volume(volume);
    
    // Update state
    set({ volume });
  },
  
  // Toggle mute
  toggleMute: () => {
    const { muted } = get();
    
    // Toggle global mute
    Howler.mute(!muted);
    
    // Update state
    set({ muted: !muted });
  },
}));