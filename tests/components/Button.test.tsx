import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>テストボタン</Button>);

    const button = screen.getByRole('button', { name: 'テストボタン' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">削除</Button>);

    let button = screen.getByRole('button', { name: '削除' });
    expect(button).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">アウトライン</Button>);
    button = screen.getByRole('button', { name: 'アウトライン' });
    expect(button).toHaveClass('border-input');

    rerender(<Button variant="secondary">セカンダリ</Button>);
    button = screen.getByRole('button', { name: 'セカンダリ' });
    expect(button).toHaveClass('bg-secondary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">小</Button>);

    let button = screen.getByRole('button', { name: '小' });
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">大</Button>);
    button = screen.getByRole('button', { name: '大' });
    expect(button).toHaveClass('h-11');
  });

  it('can be disabled', () => {
    render(<Button disabled>無効</Button>);

    const button = screen.getByRole('button', { name: '無効' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>クリック</Button>);

    const button = screen.getByRole('button', { name: 'クリック' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
