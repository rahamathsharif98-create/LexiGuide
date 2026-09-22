import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LearningRunGame from '../pages/child/LearningRunGame';
import SkyArcherGame from '../pages/child/SkyArcherGame';
import CosmicMinerGame from '../pages/child/CosmicMinerGame';
import CoralDiverGame from '../pages/child/CoralDiverGame';
import MagicBakeryGame from '../pages/child/MagicBakeryGame';
import DinoFossilGame from '../pages/child/DinoFossilGame';
import CloudBouncerGame from '../pages/child/CloudBouncerGame';
import VoxelCrafterGame from '../pages/child/VoxelCrafterGame';
import SafariPhotoGame from '../pages/child/SafariPhotoGame';
import AncientLabyrinthGame from '../pages/child/AncientLabyrinthGame';

describe('Render all 10 Game Pages', () => {
  it('renders LearningRunGame', () => {
    expect(() => render(<MemoryRouter><LearningRunGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders SkyArcherGame', () => {
    expect(() => render(<MemoryRouter><SkyArcherGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders CosmicMinerGame', () => {
    expect(() => render(<MemoryRouter><CosmicMinerGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders CoralDiverGame', () => {
    expect(() => render(<MemoryRouter><CoralDiverGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders MagicBakeryGame', () => {
    expect(() => render(<MemoryRouter><MagicBakeryGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders DinoFossilGame', () => {
    expect(() => render(<MemoryRouter><DinoFossilGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders CloudBouncerGame', () => {
    expect(() => render(<MemoryRouter><CloudBouncerGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders VoxelCrafterGame', () => {
    expect(() => render(<MemoryRouter><VoxelCrafterGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders SafariPhotoGame', () => {
    expect(() => render(<MemoryRouter><SafariPhotoGame /></MemoryRouter>)).not.toThrow();
  });
  it('renders AncientLabyrinthGame', () => {
    expect(() => render(<MemoryRouter><AncientLabyrinthGame /></MemoryRouter>)).not.toThrow();
  });
});
