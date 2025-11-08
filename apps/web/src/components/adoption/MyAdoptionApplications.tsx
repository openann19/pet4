interface MyAdoptionApplicationsProps {
  userId: string;
}

export function MyAdoptionApplications({ userId: _userId }: MyAdoptionApplicationsProps) {
  return (
    <div className="space-y-4 py-6">
      <p className="text-muted-foreground">Your adoption applications will appear here.</p>
    </div>
  );
}
