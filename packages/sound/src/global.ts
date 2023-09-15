export const GlobalAudioContext = new AudioContext();

export function makeSound() {
  const osc = GlobalAudioContext.createOscillator();
  const g = GlobalAudioContext.createGain();

  osc.connect(g);
  osc.frequency.value = 1;

  const wave = GlobalAudioContext.createPeriodicWave(new Float32Array(2), new Float32Array(2));
  osc.setPeriodicWave(wave);
  g.connect(GlobalAudioContext.destination);
  g.gain.value = 0;
  osc.start();
  g.gain.linearRampToValueAtTime(0.6, GlobalAudioContext.currentTime + 0.01);
  osc.stop(GlobalAudioContext.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.01, GlobalAudioContext.currentTime + 0.01);
}
