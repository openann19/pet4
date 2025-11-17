/**
 * Test utilities for wrapping React Testing Library actions in act()
 */
import { act } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/**
 * Wraps user event actions in act() to prevent React warnings
 */
export const actUserEvent = {
  async click(user: UserEvent, element: HTMLElement) {
    await act(async () => {
      await user.click(element);
    });
  },

  async type(user: UserEvent, element: HTMLElement, text: string) {
    await act(async () => {
      await user.type(element, text);
    });
  },

  async clear(user: UserEvent, element: HTMLElement) {
    await act(async () => {
      await user.clear(element);
    });
  },

  async selectOptions(user: UserEvent, element: HTMLElement, values: string | string[]) {
    await act(async () => {
      await user.selectOptions(element, values);
    });
  },

  async upload(user: UserEvent, element: HTMLElement, file: File | File[]) {
    await act(async () => {
      await user.upload(element, file);
    });
  },

  async hover(user: UserEvent, element: HTMLElement) {
    await act(async () => {
      await user.hover(element);
    });
  },

  async unhover(user: UserEvent, element: HTMLElement) {
    await act(async () => {
      await user.unhover(element);
    });
  },

  async tab(user: UserEvent, options?: { shift?: boolean }) {
    await act(async () => {
      await user.tab(options);
    });
  },

  async keyboard(user: UserEvent, input: string) {
    await act(async () => {
      await user.keyboard(input);
    });
  },
};

/**
 * Wraps any async function in act()
 */
export async function actAsync<T>(fn: () => Promise<T>): Promise<T> {
  let result: T;
  await act(async () => {
    result = await fn();
  });
  return result!;
}

/**
 * Wraps any sync function in act()
 */
export function actSync<T>(fn: () => T): T {
  let result: T;
  act(() => {
    result = fn();
  });
  return result!;
}
