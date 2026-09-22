import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { gameSound } from '../services/gameSoundService';
import GameSoundToggle from '../components/games/GameSoundToggle';
import VFXScreenConfetti from '../games/common/vfx/VFXScreenConfetti';

describe('GameSoundService & Child Audio Companion', () => {
  beforeEach(() => {
    gameSound.setSoundMode('voice_and_sfx');
  });

  it('initializes with valid sound mode', () => {
    expect(['voice_and_sfx', 'sfx_only', 'muted']).toContain(gameSound.getSoundMode());
  });

  it('cycles between sound modes: voice_and_sfx -> sfx_only -> muted -> voice_and_sfx', () => {
    gameSound.setSoundMode('voice_and_sfx');
    expect(gameSound.cycleSoundMode()).toBe('sfx_only');
    expect(gameSound.cycleSoundMode()).toBe('muted');
    expect(gameSound.cycleSoundMode()).toBe('voice_and_sfx');
  });

  it('notifies subscribers when sound mode changes', () => {
    const listener = vi.fn();
    const unsub = gameSound.subscribe(listener);

    gameSound.setSoundMode('sfx_only');
    expect(listener).toHaveBeenCalledWith('sfx_only');

    unsub();
    gameSound.setSoundMode('voice_and_sfx');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('safely synthesizes musical chimes and action SFX without throwing', () => {
    expect(() => {
      gameSound.playLetterNote(0);
      gameSound.playLetterNote(1);
      gameSound.playLetterNote(2);
      gameSound.playLetterNote(3);
      gameSound.playPop();
      gameSound.playSnap();
      gameSound.playBrush();
      gameSound.playLaserMining();
      gameSound.playSparkle();
      gameSound.playFanfare();
      gameSound.playGentleOops();
      gameSound.playBounce();
      gameSound.playShutter();
      gameSound.playChime(440);
    }).not.toThrow();
  });

  it('silences speech when in sfx_only or muted mode', () => {
    const speakSpy = vi.fn();
    if (typeof window !== 'undefined') {
      window.speechSynthesis = {
        speak: speakSpy,
        cancel: vi.fn(),
        getVoices: () => [],
      };
    }

    // sfx_only mode must NEVER speak
    gameSound.setSoundMode('sfx_only');
    gameSound.speakCompanion('Hello little star!');
    expect(speakSpy).not.toHaveBeenCalled();

    // muted mode must NEVER speak
    gameSound.setSoundMode('muted');
    gameSound.speakCompanion('Hello little star!');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('GameSoundToggle UI Component', () => {
  it('renders correctly and cycles audio modes on click', () => {
    gameSound.setSoundMode('voice_and_sfx');
    render(<GameSoundToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Voice + Chimes');

    // Click to cycle to chimes only
    fireEvent.click(button);
    expect(gameSound.getSoundMode()).toBe('sfx_only');
    expect(button.textContent).toContain('Chimes Only');

    // Click to cycle to muted
    fireEvent.click(button);
    expect(gameSound.getSoundMode()).toBe('muted');
    expect(button.textContent).toContain('Muted');
  });
});

describe('VFXScreenConfetti Component', () => {
  it('renders confetti particles when active=true', () => {
    const { container } = render(<VFXScreenConfetti active={true} duration={1000} />);
    const particles = container.querySelectorAll('.animate-bounce');
    expect(particles.length).toBeGreaterThan(0);
  });

  it('renders nothing when active=false', () => {
    const { container } = render(<VFXScreenConfetti active={false} />);
    expect(container.firstChild).toBeNull();
  });
});
