# LLM Error Handling Improvements

## Overview

This document describes the improvements made to handle LLM (Large Language Model) API errors gracefully throughout the application.

## Issues Identified

### 1. Iframe Sandbox Security Warnings

**Symptom**: Console warnings stating "An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing"

**Root Cause**: These warnings originate from the `@github/spark` framework, which creates iframes for its runtime environment. The framework sets both `allow-scripts` and `allow-same-origin` sandbox attributes, which browsers flag as a potential security concern.

**Resolution**: This is a third-party framework issue and cannot be fixed in application code. The warnings do not affect application functionality. No application code creates iframes with insecure sandbox attributes.

### 2. LLM API Budget Limit Errors

**Symptom**: LLM requests failing with 403 errors: "Unable to proceed with model usage. This account has reached its budget limit."

**Root Cause**: LLM service quota exceeded, causing API calls to fail.

**Impact**: Features that rely on AI-generated content (pet profiles, photo analysis, translations) would fail without clear user feedback.

## Solutions Implemented

### 1. Centralized Error Handling (`src/lib/llm-utils.ts`)

Created a new utility module for consistent LLM error handling:

```typescript
export interface LLMErrorInfo {
  isBudgetLimit: boolean;
  isRateLimit: boolean;
  isNetworkError: boolean;
  userMessage: string;
  technicalMessage: string;
}

export function parseLLMError(error: any): LLMErrorInfo;
```

**Features**:

- Detects budget limit errors
- Detects rate limit errors
- Detects network errors
- Provides user-friendly messages
- Maintains technical details for debugging

### 2. Updated Error Handling Across All LLM Usage Points

#### Files Updated:

1. **`src/lib/seedData.ts`** - Pet profile generation
   - Better error messages when AI pet generation fails
   - Graceful fallback to static pet data
   - Clear logging of error type

2. **`src/components/admin/PetProfileGenerator.tsx`** - Admin pet generation
   - Toast notifications with specific error messages
   - User-friendly descriptions of failures
   - Extended toast duration for budget limit errors

3. **`src/components/PetPhotoAnalyzer.tsx`** - Photo analysis
   - Clear feedback when photo analysis fails
   - Distinguishes between different error types
   - Helpful suggestions for users

4. **`src/lib/adoption-seed-data.ts`** - Adoption profile generation
   - Improved logging with error categorization
   - Smooth fallback to static adoption profiles

5. **`src/lib/backend-services.ts`** - Photo safety checks
   - Better handling of failed safety scans
   - Maintains security by flagging scan failures

6. **`src/components/chat/AdvancedChatWindow.tsx`** - Message translation
   - User-friendly error messages for translation failures
   - Toast notifications with actionable feedback

7. **`src/lib/matching.ts`** - Match reasoning generation
   - Silent fallback to rule-based reasoning
   - No disruption to user experience

## Error Messages

### Budget Limit Error

- **User Message**: "AI features are temporarily unavailable due to usage limits. Using fallback data instead."
- **Technical Log**: Full error details for debugging

### Rate Limit Error

- **User Message**: "AI service is temporarily busy. Please try again in a moment."
- **Technical Log**: Rate limit details

### Network Error

- **User Message**: "Unable to connect to AI service. Using fallback data instead."
- **Technical Log**: Network error details

### Generic Error

- **User Message**: "AI service temporarily unavailable. Using fallback data instead."
- **Technical Log**: Complete error information

## Benefits

1. **Better User Experience**: Users receive clear, actionable messages instead of technical error codes
2. **Graceful Degradation**: Application continues to function with fallback data
3. **Improved Debugging**: Technical logs provide detailed error information
4. **Consistent Handling**: All LLM errors handled uniformly across the application
5. **No Breaking Changes**: All existing functionality preserved

## Testing

- ✅ Build successful with no errors
- ✅ Linter passes with no new warnings
- ✅ All LLM error paths updated
- ✅ Fallback mechanisms in place

## Recommendations

1. **Monitor LLM Usage**: Set up monitoring for LLM API usage to prevent budget limit issues
2. **Configure Alerts**: Alert when approaching quota limits
3. **Consider Caching**: Cache AI-generated content when possible to reduce API calls
4. **User Feedback**: Continue to gather user feedback on error messages
5. **Framework Update**: Monitor @github/spark for updates that may address iframe sandbox warnings

## Related Files

- `src/lib/llm-utils.ts` - New error handling utilities
- `src/lib/seedData.ts` - Updated
- `src/components/admin/PetProfileGenerator.tsx` - Updated
- `src/components/PetPhotoAnalyzer.tsx` - Updated
- `src/lib/adoption-seed-data.ts` - Updated
- `src/lib/backend-services.ts` - Updated
- `src/components/chat/AdvancedChatWindow.tsx` - Updated
- `src/lib/matching.ts` - Updated
