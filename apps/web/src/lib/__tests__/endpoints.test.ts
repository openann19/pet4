import { describe, it, expect } from 'vitest';
import { ENDPOINTS, buildUrl } from '../endpoints';

describe('ENDPOINTS', () => {
  it('should have all required endpoint categories', () => {
    expect(ENDPOINTS).toHaveProperty('AUTH');
    expect(ENDPOINTS).toHaveProperty('USERS');
    expect(ENDPOINTS).toHaveProperty('ADOPTION');
    expect(ENDPOINTS).toHaveProperty('MATCHING');
    expect(ENDPOINTS).toHaveProperty('PAYMENTS');
    expect(ENDPOINTS).toHaveProperty('UPLOADS');
    expect(ENDPOINTS).toHaveProperty('CHAT');
    expect(ENDPOINTS).toHaveProperty('NOTIFICATIONS');
    expect(ENDPOINTS).toHaveProperty('COMMUNITY');
    expect(ENDPOINTS).toHaveProperty('ADMIN');
    expect(ENDPOINTS).toHaveProperty('KYC');
    expect(ENDPOINTS).toHaveProperty('GDPR');
    expect(ENDPOINTS).toHaveProperty('BLOCKING');
    expect(ENDPOINTS).toHaveProperty('LOST_FOUND');
    expect(ENDPOINTS).toHaveProperty('STREAMING');
    expect(ENDPOINTS).toHaveProperty('SYNC');
    expect(ENDPOINTS).toHaveProperty('PHOTOS');
    expect(ENDPOINTS).toHaveProperty('MODERATION');
    expect(ENDPOINTS).toHaveProperty('QUOTAS');
    expect(ENDPOINTS).toHaveProperty('AUDIT');
    expect(ENDPOINTS).toHaveProperty('EVENTS');
    expect(ENDPOINTS).toHaveProperty('IMAGES');
  });

  it('should have consistent auth endpoints', () => {
    expect(ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    expect(ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
    expect(ENDPOINTS.AUTH.REFRESH).toBe('/auth/refresh');
    expect(ENDPOINTS.AUTH.ME).toBe('/auth/me');
  });

  it('should generate dynamic endpoints correctly', () => {
    const userId = 'user123';
    const postId = 'post456';

    expect(ENDPOINTS.USERS.LOCATION_NEARBY).toBe('/users/location/nearby');
    expect(ENDPOINTS.ADOPTION.GET_LISTING(userId)).toBe(`/adoption/listings/${userId}`);
    expect(ENDPOINTS.COMMUNITY.POST(postId)).toBe(`/community/posts/${postId}`);
    expect(ENDPOINTS.COMMUNITY.COMMENT(postId)).toBe(`/community/posts/${postId}/comments`);
    expect(ENDPOINTS.COMMUNITY.LIKE_COMMENT(postId, 'comment789')).toBe(
      `/community/posts/${postId}/comments/comment789/like`
    );
  });

  it('should handle null/undefined in dynamic endpoints', () => {
    expect(ENDPOINTS.ADOPTION.GET_LISTING(null as any)).toBe('/adoption/listings/');
    expect(ENDPOINTS.ADOPTION.GET_LISTING(undefined as any)).toBe('/adoption/listings/');
    expect(ENDPOINTS.ADMIN.USER(null as any)).toBe('/admin/users/');
    expect(ENDPOINTS.ADMIN.USER(undefined as any)).toBe('/admin/users/');
  });
});

describe('buildUrl', () => {
  it('should return endpoint unchanged when no params provided', () => {
    const endpoint = '/api/test';
    expect(buildUrl(endpoint)).toBe(endpoint);
  });

  it('should build URL with simple params', () => {
    const endpoint = '/api/test';
    const params = { foo: 'bar', baz: 'qux' };
    const result = buildUrl(endpoint, params);

    expect(result).toBe('/api/test?foo=bar&baz=qux');
  });

  it('should handle array params', () => {
    const endpoint = '/api/test';
    const params = { tags: ['tag1', 'tag2', 'tag3'] };
    const result = buildUrl(endpoint, params);

    expect(result).toBe('/api/test?tags=tag1&tags=tag2&tags=tag3');
  });

  it('should handle object params by JSON stringifying', () => {
    const endpoint = '/api/test';
    const params = { filter: { type: 'dog', age: { min: 1, max: 5 } } };
    const result = buildUrl(endpoint, params);

    expect(result).toBe('/api/test?filter=' + encodeURIComponent(JSON.stringify(params.filter)));
  });

  it('should skip undefined and null values', () => {
    const endpoint = '/api/test';
    const params = { foo: 'bar', baz: undefined, qux: null, keep: 'value' };
    const result = buildUrl(endpoint, params);

    expect(result).toBe('/api/test?foo=bar&keep=value');
  });

  it('should convert all primitive types to string', () => {
    const endpoint = '/api/test';
    const params = { string: 'text', number: 42, boolean: true };
    const result = buildUrl(endpoint, params);

    expect(result).toBe('/api/test?string=text&number=42&boolean=true');
  });

  it('should handle complex nested structures', () => {
    const endpoint = '/api/test';
    const params = {
      user: { id: '123', name: 'John' },
      tags: ['pet', 'dog', 'friendly'],
      active: true,
      page: 1,
      limit: undefined,
    };
    const result = buildUrl(endpoint, params);

    expect(result).toContain('user=' + encodeURIComponent(JSON.stringify(params.user)));
    expect(result).toContain('tags=pet');
    expect(result).toContain('tags=dog');
    expect(result).toContain('tags=friendly');
    expect(result).toContain('active=true');
    expect(result).toContain('page=1');
    expect(result).not.toContain('limit');
  });
});
