/**
 * Type declarations for date-fns
 * The package includes its own types at index.d.ts
 * This ensures TypeScript can resolve the module when types aren't automatically discovered
 */

declare module 'date-fns' {
  // Common date-fns functions used in the codebase
  export function format(date: Date | number, formatStr: string, options?: unknown): string;
  export function formatDistanceToNow(date: Date | number, options?: unknown): string;
  
  // Additional common functions
  export function parse(dateString: string, formatString: string, referenceDate?: Date | number): Date;
  export function addDays(date: Date | number, amount: number): Date;
  export function addWeeks(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function addYears(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function subWeeks(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function subYears(date: Date | number, amount: number): Date;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInWeeks(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInMonths(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInYears(dateLeft: Date | number, dateRight: Date | number): number;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isEqual(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameWeek(dateLeft: Date | number, dateRight: Date | number, options?: unknown): boolean;
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameYear(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfWeek(date: Date | number, options?: unknown): Date;
  export function endOfWeek(date: Date | number, options?: unknown): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfYear(date: Date | number): Date;
  export function endOfYear(date: Date | number): Date;
  export function getDay(date: Date | number): number;
  export function getMonth(date: Date | number): number;
  export function getYear(date: Date | number): number;
  export function getDate(date: Date | number): number;
  export function getHours(date: Date | number): number;
  export function getMinutes(date: Date | number): number;
  export function getSeconds(date: Date | number): number;
  export function setDay(date: Date | number, day: number, options?: unknown): Date;
  export function setMonth(date: Date | number, month: number): Date;
  export function setYear(date: Date | number, year: number): Date;
  export function setDate(date: Date | number, dayOfMonth: number): Date;
  export function setHours(date: Date | number, hours: number): Date;
  export function setMinutes(date: Date | number, minutes: number): Date;
  export function setSeconds(date: Date | number, seconds: number): Date;
  export function now(): number;
  export function today(): Date;
  export function yesterday(): Date;
  export function tomorrow(): Date;
  // The actual package has many more functions - add as needed
}
