import { isTruthy, isDefined } from '@petspark/shared';

export interface SearchOptions<T> {
  keys: (keyof T)[];
  threshold?: number;
  caseSensitive?: boolean;
  sortResults?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
}

export class SmartSearch<T> {
  private items: T[];
  private options: Required<SearchOptions<T>>;

  constructor(items: T[], options: SearchOptions<T>) {
    this.items = items;
    this.options = {
      threshold: 0.3,
      caseSensitive: false,
      sortResults: true,
      ...options,
    };
  }

  search(query: string): SearchResult<T>[] {
    if (!query.trim()) return [];

    const normalizedQuery = this.options.caseSensitive ? query : query.toLowerCase();

    const results: SearchResult<T>[] = [];

    for (const item of this.items) {
      const { score, matches } = this.calculateScore(item, normalizedQuery);

      if (score >= this.options.threshold) {
        results.push({ item, score, matches });
      }
    }

    if (this.options.sortResults) {
      results.sort((a, b) => b.score - a.score);
    }

    return results;
  }

  private calculateScore(item: T, query: string): { score: number; matches: string[] } {
    let totalScore = 0;
    const matches: string[] = [];

    for (const key of this.options.keys) {
      const value = String(item[key] || '');
      const normalizedValue = this.options.caseSensitive ? value : value.toLowerCase();

      if (normalizedValue.includes(query)) {
        const exactMatch = normalizedValue === query;
        const startsWithMatch = normalizedValue.startsWith(query);
        const wordBoundaryMatch = this.hasWordBoundaryMatch(normalizedValue, query);

        let keyScore = 0;
        if (exactMatch) keyScore = 1.0;
        else if (startsWithMatch) keyScore = 0.9;
        else if (wordBoundaryMatch) keyScore = 0.7;
        else keyScore = 0.5;

        totalScore += keyScore;
        matches.push(String(key));
      } else {
        const fuzzyScore = this.fuzzyMatch(normalizedValue, query);
        if (fuzzyScore > 0) {
          totalScore += fuzzyScore * 0.3;
          matches.push(String(key));
        }
      }
    }

    const score = Math.min(totalScore / this.options.keys.length, 1);
    return { score, matches };
  }

  private hasWordBoundaryMatch(text: string, query: string): boolean {
    const words = text.split(/\s+/);
    return words.some((word) => word.startsWith(query));
  }

  private fuzzyMatch(text: string, query: string): number {
    let textIndex = 0;
    let queryIndex = 0;
    let matches = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        matches++;
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length ? matches / text.length : 0;
  }

  updateItems(items: T[]): void {
    this.items = items;
  }
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return text;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>${after}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export class SearchHistory {
  private static readonly STORAGE_KEY = 'search-history';
  private static readonly MAX_ITEMS = 10;

  static add(query: string): void {
    if (!query.trim()) return;

    const history = this.get();
    const filtered = history.filter((item) => item !== query);
    filtered.unshift(query);

    const trimmed = filtered.slice(0, this.MAX_ITEMS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
  }

  static get(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.every((item): item is string => typeof item === 'string')
      ) {
        return parsed;
      }

      return [];
    } catch {
      return [];
    }
  }

  static remove(query: string): void {
    const history = this.get();
    const filtered = history.filter((item) => item !== query);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
