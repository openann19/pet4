/**
 * Test utilities for wrapping async state updates in act()
 * Helps prevent React Testing Library warnings about unwrapped state updates
 */

import { act } from 'react';
import { waitFor } from '@testing-library/react';

/**
 * Wait for state update and wrap in act()
 * Use this when you need to wait for async state updates
 */
export async function waitForStateUpdate<T>(
  callback: () => T | Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  let result: T;
  await act(async () => {
    result = await waitFor(callback, options);
  });
  return result!;
}

/**
 * Wrap async operation in act() and wait for completion
 * Use this for async operations that trigger state updates
 */
export async function actAsync<T>(asyncFn: () => Promise<T>): Promise<T> {
  let result: T;
  await act(async () => {
    result = await asyncFn();
  });
  return result!;
}

/**
 * Advance fake timers and wrap in act()
 * Use this when using fake timers with async operations
 */
export async function actAdvanceTimers(
  advanceFn: () => void | Promise<void>
): Promise<void> {
  await act(async () => {
    await advanceFn();
  });
}
