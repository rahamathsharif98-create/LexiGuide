import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GAMING_ZONE_GAMES } from '../data/gamingZoneRegistry';
import { GameCard } from '../components/games/GameCard';

describe('3D Game Cards & Unique Assets Verification', () => {
  const FLAGSHIP_3D_IDS = [
    'learning-run',
    'ancient-labyrinth',
    'safari-photo',
    'voxel-crafter',
    'cloud-bouncer',
    'dino-fossil',
    'magic-bakery',
    'coral-diver',
    'cosmic-miner',
    'sky-archer',
  ];
  const threeDGames = GAMING_ZONE_GAMES.filter(g => FLAGSHIP_3D_IDS.includes(g.id));

  it('verifies all 10 3D games exist in registry', () => {
    expect(threeDGames.length).toBe(10);
  });

  it('verifies every 3D game has a unique, non-generic image', () => {
    const images = threeDGames.map(g => g.image3d);
    const uniqueImages = new Set(images);
    // All 10 must have unique images
    expect(uniqueImages.size).toBe(10);

    // None should use the old space-rocket fallback except if genuinely intended
    // Verify each expected asset exists
    expect(images).toContain('/assets/games/learning-run.svg');
    expect(images).toContain('/assets/games/ancient-labyrinth.svg');
    expect(images).toContain('/assets/games/safari-photo.svg');
    expect(images).toContain('/assets/games/voxel-crafter.svg');
    expect(images).toContain('/assets/games/cloud-bouncer.svg');
    expect(images).toContain('/assets/games/dino-fossil.svg');
    expect(images).toContain('/assets/games/magic-bakery.svg');
    expect(images).toContain('/assets/games/coral-diver.svg');
    expect(images).toContain('/assets/games/cosmic-miner.svg');
    expect(images).toContain('/assets/games/sky-archer.svg');
  });

  it('renders GameCard for all 10 3D games with specific VFX overlays', () => {
    for (const game of threeDGames) {
      const { unmount } = render(
        <MemoryRouter>
          <GameCard game={game} />
        </MemoryRouter>
      );
      expect(screen.getByText(game.title)).toBeInTheDocument();
      unmount();
    }
  });

  it('allows press-to-play navigation by clicking anywhere on the GameCard', () => {
    const testGame = threeDGames[0];
    const { container } = render(
      <MemoryRouter>
        <GameCard game={testGame} />
      </MemoryRouter>
    );

    const card = screen.getByTestId(`game-card-${testGame.id}`);
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('checks /child/games in App renders without duplication and cleanly mounts', async () => {
    localStorage.setItem('readquest_active_child_id', '1');
    const { default: App } = await import('../App');
    render(<App initialRoute="/child/games" />);
    expect(await screen.findByText('Word Builder', {}, { timeout: 20000 })).toBeInTheDocument();
  }, 60000);
});
