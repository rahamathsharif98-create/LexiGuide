import { create } from 'zustand';
import { storageService } from '../../services/storage/storageService';
import { audioService } from '../../services/audio/audioService';
import { speechService } from '../../services/speech/speechService';

// SCREEN values: 'start' | 'characterSelect' | 'worldSelect' | 'howToPlay' |
// 'achievements' | 'settings' | 'game' | 'result'

const initialSave = storageService.loadSave();

export const useAppStore = create((set) => ({
  screen: 'start',
  save: initialSave,
  selectedWorld: 'safari-temple',
  selectedCharacter: initialSave.selectedCharacter || 'explorer',
  lastResult: null,

  goTo: (screen) => set({ screen }),

  selectWorld: (worldId) => set({ selectedWorld: worldId }),

  selectCharacter: (characterId) => {
    storageService.updateSave((s) => ({ ...s, selectedCharacter: characterId }));
    set({ selectedCharacter: characterId, save: storageService.loadSave() });
  },

  refreshSave: () => set({ save: storageService.loadSave() }),

  updateSettings: (partial) => {
    const next = storageService.updateSave((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
    if ('music' in partial) audioService.setMusicEnabled(partial.music);
    if ('sfx' in partial) audioService.setSfxEnabled(partial.sfx);
    if ('voice' in partial) speechService.setEnabled(partial.voice);
    set({ save: next });
  },

  applyRunResult: (result) => {
    set({ lastResult: result, save: storageService.loadSave() });
  },

  resetProgress: () => {
    const fresh = storageService.resetSave();
    set({ save: fresh });
  },
}));

// Initialize services from saved settings on load.
audioService.setMusicEnabled(initialSave.settings.music);
audioService.setSfxEnabled(initialSave.settings.sfx);
speechService.setEnabled(initialSave.settings.voice);
