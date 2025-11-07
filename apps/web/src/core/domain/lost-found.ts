/**
 * Lost & Found Domain - Alert Workflows and Rules
 * 
 * Core business logic for lost alerts, sightings, and status transitions.
 * This is pure domain logic with no infrastructure dependencies.
 */

/**
 * Lost alert status
 * 
 * Valid state transitions:
 * - active -> found (pet is found)
 * - active -> archived (alert expires or is manually archived)
 * - found -> archived (final state)
 */
export type LostAlertStatus = 'active' | 'found' | 'archived'

/**
 * Check if a lost alert status transition is valid
 */
export function isValidLostAlertStatusTransition(
  current: LostAlertStatus,
  next: LostAlertStatus
): boolean {
  // Can't transition to the same status
  if (current === next) {
    return false
  }

  switch (current) {
    case 'active':
      // Can go to found (pet found) or archived (expired/cancelled)
      return next === 'found' || next === 'archived'

    case 'found':
      // Can go to archived (final cleanup)
      return next === 'archived'

    case 'archived':
      // Final state - no transitions allowed
      return false

    default:
      return false
  }
}

/**
 * Check if an alert can receive sightings
 */
export function canReceiveSightings(status: LostAlertStatus): boolean {
  // Can only receive sightings if active
  return status === 'active'
}

/**
 * Check if an alert can be edited
 */
export function canEditAlert(status: LostAlertStatus): boolean {
  // Can only edit if active
  return status === 'active'
}

/**
 * Check if an alert can be marked as found
 */
export function canMarkAsFound(status: LostAlertStatus): boolean {
  // Can only mark as found if currently active
  return status === 'active'
}

