/**
 * Example component showing how to use strict API types
 *
 * This demonstrates the migration pattern from legacy Partial<T> to
 * OptionalWithUndef<T> for update operations.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateAdoptionListingData } from '@/api/types';
import { AdoptionAPIStrict } from '@/api/adoption-api-strict';
import { MatchingAPIStrict } from '@/api/matching-api-strict';

const adoptionAPI = new AdoptionAPIStrict();
const matchingAPI = new MatchingAPIStrict();

/**
 * Example: Updating an adoption listing with strict optionals
 */
export function AdoptionListingUpdateExample() {
  const [listingId, setListingId] = useState('');
  const [petName, setPetName] = useState('');
  const [fee, _setFee] = useState<number | null>(null);

  const handleUpdate = async () => {
    if (!listingId) return;

    // Example 1: Update a field (omit undefined fields)
    const updateData1: UpdateAdoptionListingData = {
      petName: petName || undefined, // Only update if provided
      // fee is omitted, so it won't be changed
    };

    // Example 2: Explicitly clear a field
    const updateData2: UpdateAdoptionListingData = {
      fee: undefined, // Explicitly clear the fee field
      petName: petName || undefined,
    };

    try {
      // Use updateData1 or updateData2 based on intent
      if (fee === null) {
        // Don't change fee
        await adoptionAPI.updateListing(listingId, updateData1, 'owner123');
      } else {
        // Clear fee explicitly
        await adoptionAPI.updateListing(listingId, updateData2, 'owner123');
      }
    } catch (error) {
      // Error handling - in production, use structured logging
      if (error instanceof Error) {
        // Handle error appropriately
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="listingId">Listing ID</Label>
        <Input id="listingId" value={listingId} onChange={(e) => setListingId(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="petName">Pet Name</Label>
        <Input id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} />
      </div>
      <Button onClick={handleUpdate}>Update Listing</Button>
    </div>
  );
}

/**
 * Example: Updating preferences with strict optionals
 */
export function PreferencesUpdateExample() {
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [clearDistance, setClearDistance] = useState(false);

  const handleUpdatePreferences = async () => {
    const ownerId = 'user123';

    if (isTruthy(clearDistance)) {
      // Explicitly clear maxDistance
      await matchingAPI.updatePreferences(ownerId, {
        maxDistanceKm: undefined, // Clear the field
      });
    } else if (maxDistance !== null) {
      // Update maxDistance
      await matchingAPI.updatePreferences(ownerId, {
        maxDistanceKm: maxDistance, // Set the value
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="maxDistance">Max Distance (km)</Label>
        <Input
          id="maxDistance"
          type="number"
          value={maxDistance ?? ''}
          onChange={(e) => { setMaxDistance(e.target.value ? Number(e.target.value) : null); }}
        />
      </div>
      <div>
        <Label>
          <input
            type="checkbox"
            checked={clearDistance}
            onChange={(e) => { setClearDistance(e.target.checked); }}
          />
          Clear distance
        </Label>
      </div>
      <Button onClick={handleUpdatePreferences}>Update Preferences</Button>
    </div>
  );
}

/**
 * Migration Pattern Documentation
 *
 * Before (Legacy):
 * ```ts
 * type UpdateData = Partial<CreateData>
 * await api.update(id, { name: undefined }) // Can't distinguish from omitted
 * ```
 *
 * After (Strict):
 * ```ts
 * type UpdateData = OptionalWithUndef<CreateData>
 * await api.update(id, { name: undefined }) // Explicitly clears the field
 * await api.update(id, { email: "new@example.com" }) // Omit name, update email
 * ```
 */
export function MigrationPatternExample() {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold mb-2">Migration Pattern</h3>
      <p className="text-sm text-muted-foreground">
        See code comments for examples of migrating from Partial&lt;T&gt; to
        OptionalWithUndef&lt;T&gt;
      </p>
    </div>
  );
}
