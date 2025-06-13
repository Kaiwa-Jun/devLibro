import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/books',
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Header', () => {
  it('renders navigation tabs including reading circles', () => {
    render(<Header />);

    expect(screen.getByText('DevLibro')).toBeInTheDocument();
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('輪読会')).toBeInTheDocument();
    expect(screen.getByText('本棚')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<Header />);

    const themeToggle = screen.getByRole('button', { name: /テーマを切り替え/ });
    expect(themeToggle).toBeInTheDocument();
  });

  it('renders multiple buttons including theme toggle and auth', () => {
    render(<Header />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // テーマ切り替えボタンとAuthButton
  });
});
