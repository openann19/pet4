/**
 * Demo Page - Advanced Components Integration Test
 * This page demonstrates all our advanced components working together
 */

import * as React from 'react'
import { AdvancedFormDemo, ComponentShowcase } from '@/components/demo/AdvancedComponentsDemo'
import { Button } from '@/components/ui/button'

export default function ComponentsDemoPage() {
  const [showForm, setShowForm] = React.useState(true)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Advanced Components Demo</h1>
          <p className="text-muted-foreground mb-6">
            Production-ready UI components with zero TypeScript errors
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              variant={showForm ? 'primary' : 'outline'}
              onClick={() => setShowForm(true)}
            >
              Form Demo
            </Button>
            <Button
              variant={!showForm ? 'primary' : 'outline'}
              onClick={() => setShowForm(false)}
            >
              Component Showcase
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {showForm ? <AdvancedFormDemo /> : <ComponentShowcase />}
        </div>
      </div>
    </div>
  )
}