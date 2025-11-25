/**
 * Accordion Tests
 *
 * Comprehensive tests for Accordion component covering all variants, props, and interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

describe('Accordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render accordion', () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      const content = screen.getByRole('region', { hidden: true });
      expect(content).toHaveAttribute('data-slot', 'accordion-content');
      expect(content).toHaveAttribute('data-state', 'closed');
    });

    it('should render multiple accordion items', () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      const regions = screen.getAllByRole('region', { hidden: true });
      expect(regions).toHaveLength(2);
      regions.forEach((region) => {
        expect(region).toHaveAttribute('data-slot', 'accordion-content');
        expect(region).toHaveAttribute('data-state', 'closed');
      });
    });
  });

  describe('Interactions', () => {
    it('should expand item when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: /item 1/i });
      await user.click(trigger);

      // Content should be visible after click
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeVisible();
      });
    });

    it('should collapse item when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: /item 1/i });
      const content = screen.getAllByRole('region', { hidden: true })[0];
      await user.click(trigger);
      await waitFor(() => expect(content).not.toHaveAttribute('hidden'));
      await user.click(trigger);
      await waitFor(() => expect(content).toHaveAttribute('hidden'));
    });

    it('should support multiple items open in multiple mode', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger1 = screen.getByRole('button', { name: /item 1/i });
      const trigger2 = screen.getByRole('button', { name: /item 2/i });
      const [content1, content2] = screen.getAllByRole('region', { hidden: true });

      await user.click(trigger1);
      await user.click(trigger2);

      // Both items should be open
      await waitFor(() => {
        expect(content1).not.toHaveAttribute('hidden');
        expect(content2).not.toHaveAttribute('hidden');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: /item 1/i });
      expect(trigger).toHaveAttribute('aria-expanded');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button', { name: /item 1/i });
      await user.tab();
      expect(trigger).toHaveFocus();

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeVisible();
      });
    });
  });

  describe('Data Attributes', () => {
    it('should have data-slot attributes', () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const accordion = screen.getByText('Item 1').closest('[data-slot="accordion"]');
      expect(accordion).toBeInTheDocument();
    });
  });
});
