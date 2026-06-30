
import { SOUND_EFFECTS } from '../constants';

class SoundManagerClass {
    private audioCache: Partial<Record<keyof typeof SOUND_EFFECTS, HTMLAudioElement>> = {};
    private soundEnabled: boolean = true;
    private buttonSoundsEnabled: boolean = true;

    constructor() {
        // PRELOAD CRITICAL SOUNDS FOR ZERO DELAY
        if (typeof Audio !== "undefined") {
            try {
                // Preload 'click'
                this.preload('click');
                // Preload 'back' (Distinct sound for back navigation)
                this.preload('back');
                // Preload 'tap' (Softer interaction)
                this.preload('tap');
            } catch (e) {
                console.error("Audio init error", e);
            }
        }
    }

    private preload(key: keyof typeof SOUND_EFFECTS) {
        const audio = new Audio(SOUND_EFFECTS[key]);
        audio.preload = 'auto';
        audio.volume = 0.5;
        this.audioCache[key] = audio;
    }

    public syncSettings(settings: any) {
        this.soundEnabled = settings.soundEnabled;
        this.buttonSoundsEnabled = settings.buttonSoundsEnabled !== false;
        
        // Update volume for all cached audios
        const vol = settings.volume !== undefined ? settings.volume : 0.5;
        Object.values(this.audioCache).forEach(audio => {
            if(audio) audio.volume = vol;
        });
    }

    public startMusic() { /* No-op */ }
    public stopMusic() { /* No-op */ }

    public play(type: keyof typeof SOUND_EFFECTS) {
        if (!this.soundEnabled) return;
        
        // Check for button sounds
        const isButtonSound = type === 'click' || type === 'tap' || type === 'back';
        if (isButtonSound && !this.buttonSoundsEnabled) return;

        try {
            // Optimized Path for Cached Sounds (Zero Delay)
            if (this.audioCache[type]) {
                const audio = this.audioCache[type]!;
                audio.currentTime = 0; // Reset to start immediately
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {}); // Ignore interaction errors for rapid clicks
                }
                return;
            }

            // Standard Path for non-critical sounds (Success, Finish, etc.)
            const soundSrc = SOUND_EFFECTS[type];
            if (!soundSrc) return;

            const audio = new Audio(soundSrc);
            // Use volume from a cached element if available to stay synced, or default
            audio.volume = this.audioCache['click'] ? this.audioCache['click']!.volume : 0.5;
            audio.play().catch(() => {});

        } catch (e) {
            // Silent fail
        }
    }
}

export const SoundManager = new SoundManagerClass();
