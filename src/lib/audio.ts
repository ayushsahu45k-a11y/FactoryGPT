// Fully Synthesized Web Audio API Industrial Siren & Speech Synthesis Engine
// Designed specifically for high-fidelity interactive feedback, zero asset-loading overhead, and 100% offline compliance.

const getNaturalEnglishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
  if (englishVoices.length === 0) return null;

  const rank = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    if (name.includes("natural")) return 100;
    if (name.includes("google") && (name.includes("us english") || name.includes("uk english") || name.includes("english"))) return 95;
    if (name.includes("google")) return 90;
    if (name.includes("premium") || name.includes("enhanced") || name.includes("hi-fi")) return 80;
    if (name.includes("samantha") || name.includes("hazel") || name.includes("daniel") || name.includes("siri")) return 70;
    if (name.includes("susan") || name.includes("zira") || name.includes("david") || name.includes("mark")) return 60;
    if (name.includes("microsoft")) return 50;
    return 10;
  };

  return [...englishVoices].sort((a, b) => rank(b) - rank(a))[0] || null;
};

class AlertAudioEngine {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null; // Low Frequency Oscillator for the pitch-swept siren effect
  private gainNode: GainNode | null = null;
  private isSirenActive: boolean = false;
  private spokenAlerts: Set<string> = new Set();
  private userMuted: boolean = false;

  private initCtx() {
    if (!this.audioCtx) {
      // Modern standards & webkit fallback
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /**
   * Resumes and unlocks the AudioContext on an explicit user gesture (e.g. click).
   * This defeats browser autoplay safety locks.
   */
  public armSpeaker() {
    this.initCtx();
  }

  public toggleMute() {
    this.userMuted = !this.userMuted;
    if (this.userMuted) {
      this.stopSiren();
    }
    return this.userMuted;
  }

  public getIsMuted() {
    return this.userMuted;
  }

  /**
   * Synthesizes an emergency sweeping pitch siren (oscillates between 500Hz to 950Hz)
   */
  public startSiren(isAmplified: boolean = false) {
    if (this.userMuted) return;
    this.initCtx();
    if (!this.audioCtx) return;

    const targetVolume = isAmplified ? 0.35 : 0.08; // 437% volume boost!

    if (this.isSirenActive) {
      if (this.gainNode) {
        try {
          this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioCtx.currentTime);
          this.gainNode.gain.linearRampToValueAtTime(targetVolume, this.audioCtx.currentTime + 0.2);
        } catch {}
      }
      return;
    }

    try {
      this.isSirenActive = true;

      // Create primary oscillator
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = "sawtooth"; // Industrial rasp

      // Create LFO to sweep pitch up and down rhythmicaly (Siren effect)
      this.lfo = this.audioCtx.createOscillator();
      this.lfo.frequency.value = 1.8; // 1.8Hz cycle frequency

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.value = 220; // range of the pitch sweep (variance in Hz)

      // Center pitch frequency around 650Hz
      this.oscillator.frequency.value = 650;

      // Create main gain node for volume controller
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      // Soft start to avoid loud clicking
      this.gainNode.gain.linearRampToValueAtTime(targetVolume, this.audioCtx.currentTime + 0.3);

      // Route: LFO -> LFO-Gain -> Oscillator Frequency Pin
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.oscillator.frequency);

      // Route: Oscillator -> Master Gain -> Audio output Speakers
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      // Fire oscillators
      this.lfo.start();
      this.oscillator.start();
    } catch (e) {
      console.warn("Failed to start AudioContext siren:", e);
      this.isSirenActive = false;
    }
  }

  /**
   * Synthesizes a positive mechanical confirmation chime (using sine wave harmonics)
   */
  public playSuccessChime() {
    if (this.userMuted) return;
    this.initCtx();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.09, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      const osc = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      
      osc.type = "sine";
      osc2.type = "sine";

      // Perfect fifth mechanical harmony (E5-B5)
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(987.77, now + 0.12); // B5
      
      osc2.frequency.setValueAtTime(329.63, now); // E4
      osc2.frequency.setValueAtTime(493.88, now + 0.12); // B4

      osc.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc.start(now);
      osc2.start(now);
      
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (err) {
      console.warn("Chime synth aborted:", err);
    }
  }

  /**
   * Stops the synthesized pitch-swept siren cleanly
   */
  public stopSiren() {
    if (!this.isSirenActive) return;

    try {
      const now = this.audioCtx ? this.audioCtx.currentTime : 0;
      
      // Ramp down volume softly
      if (this.gainNode && this.audioCtx) {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
      }

      // Stop sources after volume ramp-down completes
      const oscToStop = this.oscillator;
      const lfoToStop = this.lfo;
      
      setTimeout(() => {
        try {
          oscToStop?.stop();
          lfoToStop?.stop();
          oscToStop?.disconnect();
          lfoToStop?.disconnect();
        } catch {}
      }, 300);

      this.oscillator = null;
      this.lfo = null;
      this.gainNode = null;
      this.isSirenActive = false;
    } catch {
      this.isSirenActive = false;
    }
  }

  /**
   * Synthesizes automated machine voice announcements using global speech synthesis
   * @param text Speech warning content
   * @param incidentId Unique ID to prevent spamming the announcement
   */
  public announceEmergencyVoice(text: string, incidentId?: string) {
    if (this.userMuted) return;
    
    if (incidentId) {
      if (this.spokenAlerts.has(incidentId)) return; // Already declared to floor
      this.spokenAlerts.add(incidentId);
    }

    if (!("speechSynthesis" in window)) {
      return; // Speech not supported in browser
    }

    try {
      // Squelch current speech quickly so emergency broadcasts are instantaneous!
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Locate high-fidelity natural English voice
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = getNaturalEnglishVoice(voices);
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      // 100% natural conversational parameters (no speed distortion, no artificial flat pitch hum)
      utterance.rate = 0.98; // Steady, highly understandable and well-paced pace for anyone
      utterance.pitch = 1.0; // Perfect standard neutral pitch (no low artificial robotic pitch drop)
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis interface aborted:", e);
    }
  }
}

export const alarmEngine = new AlertAudioEngine();
