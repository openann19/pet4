import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('custom-card');
    });

    it('should have default card styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-card', 'rounded-xl', 'border');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader>Header</CardHeader>);
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('should have font-semibold class', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveAttribute('data-slot', 'card-description');
    });

    it('should have text-muted-foreground class', () => {
      render(<CardDescription>Description</CardDescription>);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardAction', () => {
    it('should render card action', () => {
      render(<CardAction>Action</CardAction>);
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      const action = screen.getByTestId('action');
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('should have padding classes', () => {
      render(<CardContent>Content</CardContent>);
      const content = screen.getByText('Content');
      expect(content).toHaveClass('px-6');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should have data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('should have flex layout', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('flex', 'items-center');
    });
  });

  describe('Complete Card', () => {
    it('should render complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>Card content here</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      expect(screen.getByText('Card content here')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });
});
