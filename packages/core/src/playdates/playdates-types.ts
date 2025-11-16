/**
 * Playdates Types
 *
 * Shared types for playdates system
 */

export type PlaydateStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PlaydateVisibility = 'public' | 'friends' | 'private';

export interface PlaydateLocation {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface PlaydateParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  petId: string;
  petName: string;
  petPhoto: string;
  joinedAt: string;
  checkedIn?: boolean;
  checkedInAt?: string;
}

export interface Playdate {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string | null;
  title: string;
  description?: string;
  petId: string;
  petName: string;
  petPhoto: string;
  scheduledAt: string;
  duration: number;
  location: PlaydateLocation;
  status: PlaydateStatus;
  visibility: PlaydateVisibility;
  maxParticipants?: number;
  participants: PlaydateParticipant[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  trustedContactId?: string;
}

export interface CreatePlaydateRequest {
  title: string;
  description?: string;
  petId: string;
  scheduledAt: string;
  duration: number;
  location: PlaydateLocation;
  visibility: PlaydateVisibility;
  maxParticipants?: number;
  isPublic: boolean;
  trustedContactId?: string;
}

export interface CreatePlaydateResponse {
  playdate: Playdate;
}

export interface GetPlaydatesResponse {
  playdates: Playdate[];
}

export interface JoinPlaydateResponse {
  playdate: Playdate;
}

