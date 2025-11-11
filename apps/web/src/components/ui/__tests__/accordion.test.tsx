/**
 * Accordion Tests
 *
 * Comprehensive tests for Accordion component covering all variants, props, and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';

describe('Accordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render accordion', () => {
      render(
        <Accordion>
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should render multiple accordion items', () => {
      render(
        <Accordion>
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
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
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
      await user.click(trigger);
      await user.click(trigger);

      // Content should be hidden after second click
      await waitFor(() => {
        const content = screen.getByText('Content 1');
        expect(content).not.toBeVisible();
      });
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

      await user.click(trigger1);
      await user.click(trigger2);

      // Both items should be open
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeVisible();
        expect(screen.getByText('Content 2')).toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Accordion>
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
        <Accordion>
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
        <Accordion>
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

