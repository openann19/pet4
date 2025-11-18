'use client';

import { useCallback, useRef, useState } from 'react';
import type { MessageTemplate, SmartSuggestion } from '@/lib/chat-types';
import type { InputRef } from '@/components/ui/input';

export interface UseInputHandlingOptions {
  onSendMessage: (content: string, type?: 'text' | 'sticker') => void;
}

export interface UseInputHandlingReturn {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<InputRef>;
  showStickers: boolean;
  setShowStickers: React.Dispatch<React.SetStateAction<boolean>>;
  showTemplates: boolean;
  setShowTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  showSmartSuggestions: boolean;
  setShowSmartSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  handleInputChange: (value: string) => void;
  handleTemplateSelect: (template: MessageTemplate) => void;
  handleSuggestionSelect: (suggestion: SmartSuggestion) => void;
  handleStickerSelect: (emoji: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  resetInput: () => void;
}

export function useInputHandling(options: UseInputHandlingOptions): UseInputHandlingReturn {
  const { onSendMessage } = options;

  const [inputValue, setInputValue] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const inputRef = useRef<InputRef>(null);

  const handleInputChange = useCallback((value: string): void => {
    setInputValue(value);
  }, []);

  const handleTemplateSelect = useCallback((template: MessageTemplate): void => {
    setInputValue(template.content ?? (template.text || ''));
    setShowTemplates(false);
    inputRef.current?.focus();
  }, []);

  const handleSuggestionSelect = useCallback(
    (suggestion: SmartSuggestion): void => {
      onSendMessage(suggestion.text, 'text');
      setShowSmartSuggestions(false);
      setTimeout(() => {
        setShowSmartSuggestions(true);
      }, 2000);
    },
    [onSendMessage]
  );

  const handleStickerSelect = useCallback(
    (emoji: string): void => {
      onSendMessage(emoji, 'sticker');
      setShowStickers(false);
    },
    [onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (inputValue.trim()) {
          onSendMessage(inputValue, 'text');
          setInputValue('');
          setShowStickers(false);
          setShowTemplates(false);
          setShowSmartSuggestions(false);
          setTimeout(() => {
            setShowSmartSuggestions(true);
          }, 2000);
        }
      }
    },
    [inputValue, onSendMessage]
  );

  const resetInput = useCallback((): void => {
    setInputValue('');
    setShowStickers(false);
    setShowTemplates(false);
  }, []);

  return {
    inputValue,
    setInputValue,
    inputRef,
    showStickers,
    setShowStickers,
    showTemplates,
    setShowTemplates,
    showSmartSuggestions,
    setShowSmartSuggestions,
    handleInputChange,
    handleTemplateSelect,
    handleSuggestionSelect,
    handleStickerSelect,
    handleKeyDown,
    resetInput,
  };
}
