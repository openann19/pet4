import { MotionView } from '@petspark/motion';

interface CompleteStepProps {
  name: string;
  petType: string;
  breed: string;
  age: string;
  personality: string[];
}

export function CompleteStep({ name, petType, breed, age, personality }: CompleteStepProps) {
  return (
    <MotionView key="complete" className="space-y-6 text-center">
      <MotionView className="text-8xl mb-4">🎉</MotionView>
      <h3 className="text-3xl font-bold">All set!</h3>
      <p className="text-lg text-muted-foreground">
        {name || 'Your pet'}'s profile is ready to go. Let's find some perfect companions!
      </p>
      <div className="bg-muted/50 rounded-2xl p-6 space-y-3 text-left max-w-md mx-auto">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name:</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-semibold capitalize">{petType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Breed:</span>
          <span className="font-semibold">{breed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Age:</span>
          <span className="font-semibold">
            {age} {parseInt(age) === 1 ? 'year' : 'years'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Personality:</span>
          <span className="font-semibold">{personality.length} traits</span>
        </div>
      </div>
    </MotionView>
  );
}

