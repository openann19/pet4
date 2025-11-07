interface MyAdoptionListingsProps {
  userId: string
}

export function MyAdoptionListings({ userId: _userId }: MyAdoptionListingsProps) {
  return (
    <div className="space-y-4 py-6">
      <p className="text-muted-foreground">
        Your adoption listings will appear here.
      </p>
    </div>
  )
}
