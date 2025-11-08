import React, { useState, useMemo, useCallback } from 'react';
import { haptics } from '@/lib/haptics';

interface FilterCategory {
  id: string;
  label: string;
  type: 'multi-select' | 'single-select' | 'range' | 'toggle';
  options?: { id: string; label: string; icon?: React.ReactNode }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface UseFiltersOptions {
  categories: FilterCategory[];
  initialValues?: Record<string, unknown>;
  onApply?: (values: Record<string, unknown>) => void;
}

export function useFilters({ categories, initialValues = {}, onApply }: UseFiltersOptions): {
  values: Record<string, unknown>;
  activeFiltersCount: number;
  applyFilters: () => void;
  resetFilters: () => void;
  handleMultiSelect: (categoryId: string, optionId: string) => void;
  handleSingleSelect: (categoryId: string, optionId: string) => void;
  handleRangeChange: (categoryId: string, value: number[]) => void;
  handleToggle: (categoryId: string) => void;
  setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
} {
  const [localValues, setLocalValues] = useState<Record<string, unknown>>(initialValues);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(localValues).reduce((count, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) return count + 1;
      if (typeof value === 'boolean' && value) return count + 1;
      if (typeof value === 'number') {
        const category = categories.find((c) => c.id === key);
        if (category?.type === 'range' && value !== category.min) return count + 1;
      }
      return count;
    }, 0);
  }, [localValues, categories]);

  const applyFilters = useCallback(() => {
    haptics.impact('medium');
    onApply?.(localValues);
  }, [localValues, onApply]);

  const resetFilters = useCallback(() => {
    haptics.impact('light');
    const resetValues: Record<string, unknown> = {};
    categories.forEach((category) => {
      if (category.type === 'multi-select') {
        resetValues[category.id] = [];
      } else if (category.type === 'range') {
        resetValues[category.id] = category.min || 0;
      } else if (category.type === 'toggle') {
        resetValues[category.id] = false;
      } else {
        resetValues[category.id] = null;
      }
    });
    setLocalValues(resetValues);
  }, [categories]);

  const handleMultiSelect = useCallback(
    (categoryId: string, optionId: string) => {
      haptics.impact('light');
      const current = (localValues[categoryId] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];

      setLocalValues((prev) => ({ ...prev, [categoryId]: updated }));
    },
    [localValues]
  );

  const handleSingleSelect = useCallback((categoryId: string, optionId: string) => {
    haptics.impact('light');
    setLocalValues((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === optionId ? null : optionId,
    }));
  }, []);

  const handleRangeChange = useCallback((categoryId: string, value: number[]) => {
    setLocalValues((prev) => ({ ...prev, [categoryId]: value[0] }));
  }, []);

  const handleToggle = useCallback((categoryId: string) => {
    haptics.impact('light');
    setLocalValues((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  return {
    values: localValues,
    activeFiltersCount,
    applyFilters,
    resetFilters,
    handleMultiSelect,
    handleSingleSelect,
    handleRangeChange,
    handleToggle,
    setValues: setLocalValues,
  };
}
