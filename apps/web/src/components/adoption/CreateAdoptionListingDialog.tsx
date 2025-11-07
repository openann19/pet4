import { CreateAdoptionListingWizard } from './CreateAdoptionListingWizard'

interface CreateAdoptionListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAdoptionListingDialog({ open, onOpenChange, onSuccess }: CreateAdoptionListingDialogProps) {
  if (!open) {
    return null
  }

  return (
    <CreateAdoptionListingWizard
      onClose={() => { onOpenChange(false); }}
      onSuccess={() => {
        onSuccess()
        onOpenChange(false)
      }}
    />
  )
}
