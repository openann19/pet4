import { useState, useRef, useMemo } from 'react';
import { MotionView } from '@petspark/motion';
import { MagnifyingGlass, X, Clock, TrendUp, Sparkle } from '@phosphor-icons/react';
import { Input, type InputRef } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStorage } from '@/hooks/use-storage';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface SmartSearchProps<T> {
  placeholder?: string;
  data: T[];
  searchKeys: (keyof T)[];
  onSelect?: (item: T) => void;
  renderResult?: (item: T, highlight: string) => React.ReactNode;
  className?: string;
  showTrending?: boolean;
  showHistory?: boolean;
  maxResults?: number;
}

export function SmartSearch<T extends Record<string, unknown>>({
  placeholder = 'Search...',
  data,
  searchKeys,
  onSelect,
  renderResult,
  className,
  showTrending = true,
  showHistory = true,
  maxResults = 10,
}: SmartSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useStorage<string[]>('search-history', []);
  const [trendingSearches] = useStorage<string[]>('trending-searches', [
    'Golden Retriever',
    'Playful',
    'Small dogs',
    'Near me',
  ]);
  const inputRef = useRef<InputRef>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return data
      .map((item) => {
        let score = 0;
        let matchedKey = '';

        for (const key of searchKeys) {
          const value = String(item[key]).toLowerCase();

          if (value === lowerQuery) {
            score = 100;
            matchedKey = key as string;
            break;
          } else if (value.startsWith(lowerQuery)) {
            score = Math.max(score, 80);
            matchedKey = key as string;
          } else if (value.includes(lowerQuery)) {
            score = Math.max(score, 60);
            matchedKey = key as string;
          } else {
            const queryWords = lowerQuery.split(' ');
            const valueWords = value.split(' ');

            const matchingWords = queryWords.filter((qw) =>
              valueWords.some((vw) => vw.includes(qw))
            );

            if (matchingWords.length > 0) {
              score = Math.max(score, (matchingWords.length / queryWords.length) * 40);
              matchedKey = key as string;
            }
          }
        }

        return score > 0 ? { item, score, matchedKey } : null;
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [query, data, searchKeys, maxResults]);

  const handleSelect = (item: T, queryText: string) => {
    haptics.impact('light');

    if (showHistory) {
      setSearchHistory((prev) => {
        const updated = [queryText, ...(prev ?? []).filter((q) => q !== queryText)].slice(0, 10);
        return updated;
      });
    }

    onSelect?.(item);
    setQuery('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleHistoryClick = (historyQuery: string) => {
    haptics.impact('light');
    setQuery(historyQuery);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    haptics.impact('medium');
    setSearchHistory([]);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const showDropdown = Boolean(isFocused && (query.trim() || showHistory || showTrending));

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          onFocus={() => { setIsFocused(true); }}
          onBlur={() => setTimeout(() => { setIsFocused(false); }, 200)}
          placeholder={placeholder}
          aria-label={placeholder || 'Search'}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              haptics.impact('light');
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {isFocused && (query.trim() || (showHistory && searchHistory.length > 0)) && (
        <MotionView>
          <Card className="absolute top-full mt-2 w-full max-h-100 overflow-y-auto shadow-xl border z-50 p-2">
            {query.trim() ? (
              <>
                {results.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkle size={14} weight="fill" />
                      Results ({results.length})
                    </div>
                    {results.map(({ item, matchedKey }, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(item, query)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {renderResult ? (
                          renderResult(item, query)
                        ) : (
                          <div className="text-sm">
                            {highlightText(String(item[matchedKey]), query)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}
              </>
            ) : (
              <>
                {showHistory && (searchHistory ?? []).length > 0 && (
                  <div className="space-y-1 mb-3">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        Recent Searches
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="h-6 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    {(searchHistory ?? []).slice(0, 5).map((historyQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(historyQuery)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2"
                      >
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-sm">{historyQuery}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showTrending && (trendingSearches ?? []).length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <TrendUp size={14} />
                      Trending
                    </div>
                    <div className="flex flex-wrap gap-2 p-2">
                      {(trendingSearches ?? []).map((trending, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => handleHistoryClick(trending)}
                        >
                          {trending}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </MotionView>
      )}
    </div>
  );
}
