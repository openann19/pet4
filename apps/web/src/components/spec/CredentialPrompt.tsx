import { useState, useCallback } from 'react'
import type { MergedSpec } from '@petspark/spec-core'

export interface CredentialPromptProps {
  mergedSpec?: MergedSpec
  onComplete?: () => void
  className?: string
}

/**
 * Credential prompt component for guided setup
 */
export function CredentialPrompt({
  mergedSpec,
  onComplete,
  className,
}: CredentialPromptProps): React.JSX.Element | null {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [_values, setValues] = useState<Record<string, string>>({})

  const prompts = mergedSpec?.configuration.credentials?.prompts ?? []

  if (prompts.length === 0) {
    return null
  }

  const currentPrompt = prompts[currentPromptIndex]

  if (!currentPrompt) {
    return null
  }

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const formData = new FormData(e.currentTarget)
      const value = formData.get(currentPrompt.key) as string

      if (value) {
        localStorage.setItem(`credential:${currentPrompt.key}`, value)
        setValues((prev) => ({ ...prev, [currentPrompt.key]: value }))

        if (currentPromptIndex < prompts.length - 1) {
          setCurrentPromptIndex((prev) => prev + 1)
        } else {
          onComplete?.()
        }
      }
    },
    [currentPrompt, currentPromptIndex, prompts.length, onComplete]
  )

  const handleSkip = useCallback(() => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex((prev) => prev + 1)
    } else {
      onComplete?.()
    }
  }, [currentPromptIndex, prompts.length, onComplete])

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className ?? ''}`}>
      <h2 className="text-xl font-semibold mb-2">{currentPrompt.label}</h2>
      {currentPrompt.description && (
        <p className="text-sm text-gray-600 mb-4">{currentPrompt.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={currentPrompt.key} className="block text-sm font-medium mb-1">
            {currentPrompt.label}
          </label>
          <input
            type={currentPrompt.type === 'password' ? 'password' : 'text'}
            id={currentPrompt.key}
            name={currentPrompt.key}
            required={currentPrompt.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {currentPromptIndex < prompts.length - 1 ? 'Next' : 'Complete'}
          </button>
          {!currentPrompt.required && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Skip
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Step {currentPromptIndex + 1} of {prompts.length}
        </div>
      </form>
    </div>
  )
}



