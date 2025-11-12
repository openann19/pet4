import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorage } from '@/hooks/use-storage';
import { buildLLMPrompt } from '@/lib/llm-prompt';
import { llmService } from '@/lib/llm-service';
import { parseLLMError } from '@/lib/llm-utils';
import { createLogger } from '@/lib/logger';
import { Check, Sparkle, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('PetProfileGenerator');

interface GeneratedPet {
  id?: string;
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  photo: string;
  bio: string;
  personality: string[];
  interests: string[];
  lookingFor: string[];
  location: string;
  ownerName: string;
  verified: boolean;
}

export function PetProfileGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [pets, setPets] = useStorage<GeneratedPet[]>('all-pets', []);

  const generatePets = async () => {
    setIsGenerating(true);
    setGeneratedCount(0);

    try {
      toast.info('AI is generating 15 diverse pet profiles...');

      const prompt = buildLLMPrompt`Generate exactly 15 diverse and realistic pet profiles for a pet matching platform. Create a mix of dogs and cats with varied breeds, ages, personalities, and interests.

Each pet should have:
- Unique and realistic pet names
- Realistic breed names (like Golden Retriever, Maine Coon, Border Collie, Persian, Siamese, Labrador, etc.)
- Ages between 1-12 years
- Mix of male and female
- Various sizes (small, medium, large, extra-large)
- Engaging bio that captures personality (2-3 sentences)
- 3-5 personality traits from: Playful, Calm, Energetic, Gentle, Social, Independent, Affectionate, Curious, Protective, Loyal, Friendly, Quiet
- 3-5 interests from: Fetch, Swimming, Hiking, Running, Cuddling, Treats, Toys, Parks, Beach, Car Rides, Napping, Exploring
- 1-3 looking for from: Playdate, Walking Buddy, Best Friend, Training Partner, Cuddle Companion, Adventure Buddy
- Realistic location (US cities like "San Francisco, CA", "Austin, TX", "New York, NY", etc.)
- Different owner names (realistic first + last names)

Use high quality Unsplash pet photos. Use real Unsplash photo IDs for dogs and cats in this format: https://images.unsplash.com/photo-[ID]?w=800&q=80

Examples of real Unsplash photo IDs for pets:
- Dogs: 1587300408141-39e3f2d86e3f, 1561037404-61cd46aa615b, 1601758228041-f3b2795255f1, 1583511655857-d19b40a7a54e, 1558788353-f76d92427f16, 1537151608828-57f8d847fa8e, 1552053831-71594a27632d, 1548199973-03cce0bbc87b
- Cats: 1514888286974-6c03e2ca1dba, 1573865526739-10c1de0fa0d5, 1529257414772-1f6d4621e8e3, 1574158622682-e40e69881006, 1543852786-1cf6624fb86e, 1513360371669-4adf3dd7dff8, 1495360010541-bf61d9913a84, 1519052537078-e6302a4968d4

Return the result as a valid JSON object with a single property called "pets" that contains the pet list. Return ONLY the JSON object, no other text.

JSON format:
{
  "pets": [
    {
      "name": "string",
      "breed": "string",
      "age": number,
      "gender": "male" | "female",
      "size": "small" | "medium" | "large" | "extra-large",
      "photo": "string (unsplash URL)",
      "bio": "string",
      "personality": ["string"],
      "interests": ["string"],
      "lookingFor": ["string"],
      "location": "string (City, State)",
      "ownerName": "string",
      "verified": boolean (randomly true/false)
    }
  ]
}`;

      const result = await llmService.llm(prompt, 'gpt-4o', true);
      const data = JSON.parse(result);

      if (!data.pets || !Array.isArray(data.pets)) {
        throw new Error('Invalid response format');
      }

      setGeneratedCount(data.pets.length);

      const existingIds = new Set((pets || []).map((p: GeneratedPet) => p.id));
      let newPetsAdded = 0;

      const newPets = data.pets.map((pet: GeneratedPet) => {
        let id: string;
        do {
          id = `pet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        } while (existingIds.has(id));

        existingIds.add(id);
        newPetsAdded++;

        return {
          id,
          name: pet.name,
          breed: pet.breed,
          age: pet.age,
          gender: pet.gender,
          size: pet.size,
          photoUrl: pet.photo,
          photo: pet.photo,
          bio: pet.bio,
          personality: pet.personality,
          interests: pet.interests,
          lookingFor: pet.lookingFor,
          location: pet.location,
          ownerName: pet.ownerName,
          verified: pet.verified || false,
          liked: false,
          disliked: false,
          createdAt: Date.now(),
        };
      });

      setPets((currentPets) => [...(currentPets || []), ...newPets]);

      toast.success(`Successfully generated and added ${String(newPetsAdded ?? '')} new pet profiles!`, {
        duration: 5000,
      });

      logger.info('Generated pets', { count: newPets.length, pets: newPets });
    } catch (error) {
      const errorInfo = parseLLMError(error);
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate pet profiles', err, {
        technicalMessage: errorInfo.technicalMessage,
        userMessage: errorInfo.userMessage,
        action: 'generatePets',
      });
      toast.error('Failed to generate pet profiles', {
        description: errorInfo.userMessage,
        duration: 6000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle size={24} weight="fill" className="text-primary" />
          AI Pet Profile Generator
        </CardTitle>
        <CardDescription>
          Use AI to generate 15 diverse, realistic pet profiles with photos, personalities, and
          interests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={generatePets} disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? (
              <>
                <Sparkle size={20} weight="fill" className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkle size={20} weight="fill" className="mr-2" />
                Generate 15 Pets
              </>
            )}
          </Button>
        </div>

        {generatedCount > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <Check
              size={20}
              weight="bold"
              className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Successfully Generated {generatedCount} Pets
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                New pet profiles have been added to the discovery pool
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <Warning
            size={20}
            weight="fill"
            className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>AI generates unique pet profiles with realistic details</li>
              <li>Each pet has a photo from Unsplash's pet collection</li>
              <li>Personalities, interests, and bios are diverse and engaging</li>
              <li>Profiles are automatically added to the discovery feed</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
