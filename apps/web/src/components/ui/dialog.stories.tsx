/**
 * Dialog Component Storybook Stories
 * Location: apps/web/src/components/ui/dialog.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from './button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A premium dialog component with Reanimated animations, design tokens, and full accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

export const WithoutCloseButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Important Notice</DialogTitle>
            <DialogDescription>
              You must read this message before continuing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { setOpen(false); }}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

export const Simple: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Simple Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Simple Dialog</DialogTitle>
          <DialogDescription>
            This is a simple dialog with just a title and description.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    )
  },
}

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Form Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Enter your information to create a new account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                className="border rounded-md px-3 py-2"
                placeholder="Enter your name"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => { setOpen(false); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

export const WithoutHapticFeedback: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    
    return (
      <Dialog open={open} onOpenChange={setOpen} hapticFeedback={false}>
        <DialogTrigger asChild>
          <Button>Open Dialog (No Haptics)</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Without Haptics</DialogTitle>
            <DialogDescription>
              This dialog has haptic feedback disabled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

