/**
 * Helper type for DTO/patch layers where undefined is intentionally allowed.
 * Use this when you need to explicitly distinguish between:
 * - Omitted property (not present)
 * - Property set to undefined (intentionally cleared)
 *
 * @example
 * ```ts
 * type UpdateUser = OptionalWithUndef<User>;
 * // allows `{ name: undefined }` intentionally
 * ```
 */
export type OptionalWithUndef<T> = { [K in keyof T]?: T[K] | undefined };
