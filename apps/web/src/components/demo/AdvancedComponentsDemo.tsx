/**
 * Integration Test - Advanced UI Components
 * Tests all our newly created components working together
 */

import * as React from 'react'

const { useState } = React
import { Button, LoadingButton, IconButton, ButtonGroup } from '../ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label, Field } from '../ui/label'
import { Checkbox, CheckboxGroup } from '../ui/checkbox'
import { useTheme } from '@/hooks/use-theme'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/contexts/AuthContext'

// Mock icon for testing
const TestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)

/**
 * Advanced Form Demo Component
 * Showcases all UI components working together in a real form
 */
export const AdvancedFormDemo: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { signIn, signUp, isLoading, user, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
    marketingConsent: false,
    preferences: [] as string[]
  })

    const [formType, setFormType] = useState<'signin' | 'signup'>('signin')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formType === 'signin') {
        await signIn({
          email: formData.email,
          password: formData.password
        })
      } else {
        await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          agreeToTerms: formData.agreeToTerms,
          marketingConsent: formData.marketingConsent
        })
      }
    } catch (error) {
      console.error('Form submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome, {user.id}!</h1>
          <p className="text-muted-foreground">
            You are successfully authenticated using our advanced components.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm">Current theme: <strong>{theme}</strong></p>
            <p className="text-sm">Current language: <strong>{language}</strong></p>
            <p className="text-sm">Dark mode: <strong>{isDark ? 'Yes' : 'No'}</strong></p>
          </div>

          <ButtonGroup>
            <Button 
              variant="outline" 
              onClick={toggleTheme}
              leftIcon={<TestIcon />}
            >
              Toggle Theme
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLanguage(language === 'en' ? 'bg' : 'en')}
            >
              Toggle Language
            </Button>
          </ButtonGroup>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {formType === 'signin' ? 'Sign In' : 'Sign Up'}
          </h1>
          <p className="text-muted-foreground">
            Demo of our advanced UI components
          </p>
        </div>

        {/* Mode Toggle */}
        <ButtonGroup orientation="horizontal" className="w-full">
          <Button
            type="button"
            variant={formType === 'signin' ? 'primary' : 'outline'}
            onClick={() => setFormType('signin')}
            fullWidth
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={formType === 'signup' ? 'primary' : 'outline'}
            onClick={() => setFormType('signup')}
            fullWidth
          >
            Sign Up
          </Button>
        </ButtonGroup>

        {/* Email Field */}
        <Field
          label="Email Address"
          required
          error={!formData.email ? 'Email is required' : undefined}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            leftIcon={<TestIcon />}
            clearable
            onClear={() => setFormData(prev => ({ ...prev, email: '' }))}
            error={!formData.email}
          />
        </Field>

        {/* Password Field */}
        <Field
          label="Password"
          required
          description="Must be at least 8 characters"
        >
          <Input
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            showCounter
            maxLength={100}
          />
        </Field>

        {/* Sign Up Only Fields */}
        {formType === 'signup' && (
          <>
            <Field label="Username" required>
              <Input
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                leftAddon="@"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <Input
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Field>

              <Field label="Last Name">
                <Input
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Field>
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <Label>Preferences</Label>
              <CheckboxGroup
                value={formData.preferences}
                onValueChange={(preferences) => setFormData(prev => ({ ...prev, preferences }))}
              >
                <Checkbox value="notifications" label="Email notifications" />
                <Checkbox value="updates" label="Product updates" />
                <Checkbox value="newsletter" label="Weekly newsletter" />
              </CheckboxGroup>
            </div>

            {/* Terms and Marketing */}
            <div className="space-y-3">
              <Checkbox
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked }))}
                label="I agree to the Terms of Service"
                description="Required to create an account"
                required
                error={!formData.agreeToTerms}
                errorMessage="You must agree to the terms"
              />

              <Checkbox
                checked={formData.marketingConsent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: checked }))}
                label="I'd like to receive marketing emails"
                description="Optional - you can change this later"
              />
            </div>
          </>
        )}

        {/* Theme and Language Controls */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
          <Label size="sm">Demo Controls</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              leftIcon={<TestIcon />}
            >
              {isDark ? 'Light' : 'Dark'} Theme
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'bg' : 'en')}
            >
              {language.toUpperCase()}
            </Button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="space-y-3">
          <LoadingButton
            type="submit"
            isLoading={isSubmitting || isLoading}
            fullWidth
            size="lg"
            disabled={formType === 'signup' && !formData.agreeToTerms}
          >
            {formType === 'signin' ? 'Sign In' : 'Create Account'}
          </LoadingButton>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              isIconOnly
              leftIcon={<TestIcon />}
              aria-label="Google Sign In"
            >
            </Button>
            <Button
              type="button"
              variant="outline"
              isIconOnly
              leftIcon={<TestIcon />}
              aria-label="Apple Sign In"
            >
            </Button>
            <Button type="button" variant="link" size="sm" fullWidth>
              Forgot Password?
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

/**
 * Component Showcase
 * Displays all component variants for testing
 */
export const ComponentShowcase: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Component Showcase</h1>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<TestIcon />}>With Icon</Button>
            <Button rightIcon={<TestIcon />}>With Right Icon</Button>
            <LoadingButton isLoading>Loading</LoadingButton>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Default input" />
          <Input variant="filled" placeholder="Filled input" />
          <Input variant="underlined" placeholder="Underlined input" />
          <Input 
            placeholder="With icon"
            leftIcon={<TestIcon />}
            rightIcon={<TestIcon />}
          />
          <Input 
            placeholder="Clearable"
            clearable
            defaultValue="Clear me"
          />
          <Input 
            placeholder="With counter"
            showCounter
            maxLength={50}
          />
          <Input 
            placeholder="Error state"
            error
            errorMessage="This field has an error"
          />
          <Input 
            placeholder="Success state"
            success
            successMessage="Looks good!"
          />
        </div>
      </section>

      {/* Checkboxes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Checkboxes</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Default" />
            <Checkbox label="Checked" checked />
            <Checkbox label="Indeterminate" indeterminate />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="Error" error errorMessage="Required field" />
          </div>

          <div className="space-y-2">
            <Label>Checkbox Group</Label>
            <CheckboxGroup>
              <Checkbox value="option1" label="Option 1" />
              <Checkbox value="option2" label="Option 2" />
              <Checkbox value="option3" label="Option 3" />
            </CheckboxGroup>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdvancedFormDemo