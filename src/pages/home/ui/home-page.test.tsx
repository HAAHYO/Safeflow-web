import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/shared/lib/test';

import { HomePage } from './home-page';

describe('HomePage', () => {
  it('제목을 보여준다', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Safeflow' })).toBeInTheDocument();
  });
});
