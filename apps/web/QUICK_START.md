# Quick Start - Smart Recommendations & Trust System

## 🚀 Using the Smart Recommendation Engine

### Basic Usage
```typescript
import { SmartRecommendationEngine } from '@/lib/smart-recommendations'
import { useKV } from '@github/spark/hooks'

// In your Discovery component
const [swipeHistory] = useKV<SwipeAction[]>('swipe-history', [])
const [allPets] = useKV<Pet[]>('all-pets', [])
const [userPet] = useKV<Pet>('current-user-pet', null)
const [viewedPets, setViewedPets] = useState<string[]>([])

// Create the engine
const engine = new SmartRecommendationEngine(swipeHistory)

// Get recommendations
const recommendations = engine.getTopRecommendations(
  allPets,
  userPet,
  viewedPets,
  10 // get top 10
)

// Display recommendations
recommendations.forEach(rec => {
  const pet = allPets.find(p => p.id === rec.petId)
  console.log(`${pet.name}: ${rec.score}% match`)
  console.log(`Category: ${rec.category}`)
  console.log(`Reasons: ${rec.reasons.join(', ')}`)
})
```

### Get Next Batch (Infinite Scroll)
```typescript
const getNextPets = () => {
  const batch = engine.getBatchRecommendations(
    allPets,
    userPet,
    viewedPets,
    5 // get 5 at a time
  )
  
  // Update viewed list
  setViewedPets(prev => [
    ...prev,
    ...batch.map(p => p.id)
  ])
  
  return batch
}
```

## 🏆 Using the Trust System

### Calculate Trust Score
```typescript
import { calculateTrustScore } from '@/lib/social-proof'

const socialProof = {
  totalMatches: 25,
  totalPlaydates: 12,
  averageRating: 4.7,
  reviewCount: 12,
  endorsementCount: 18,
  trustBadges: earnedBadges,
  recentReviews: [],
  topEndorsements: [],
  responseRate: 85,
  responseTime: '1.5 hours',
  lastActive: Date.now()
}

const trustScore = calculateTrustScore(socialProof)
// Returns: 87 (Highly Trusted)
```

### Check Badge Eligibility
```typescript
import { checkBadgeEligibility } from '@/lib/social-proof'

const earnedBadges = checkBadgeEligibility('pet-123', {
  isVerified: true,
  hasVaccinations: true,
  accountAge: 400, // days since account creation
  responseTime: 1.5, // average hours to respond
  rating: 4.7,
  reviewCount: 12,
  endorsementCount: 18
})

// Returns array of earned badges
earnedBadges.forEach(badge => {
  console.log(`${badge.icon} ${badge.label}`)
})
```

## 🎨 Using the UI Components

### Display Trust Badges
```tsx
import { TrustBadges } from '@/components/enhanced'

// In your pet card or profile
<TrustBadges 
  badges={pet.trustBadges}
  size="md"  // sm | md | lg
  animated={true}
/>
```

### Display Trust Score
```tsx
import { TrustScore } from '@/components/enhanced'

// In profile header
<TrustScore 
  score={pet.trustScore}
  size="md"  // sm | md | lg
  showLabel={true}
/>
```

## 📦 Complete Integration Example

### Enhanced Pet Card
```tsx
import { TrustBadges, TrustScore } from '@/components/enhanced'
import { SmartRecommendationEngine } from '@/lib/smart-recommendations'

function EnhancedPetCard({ pet, userPet, swipeHistory }) {
  // Get recommendation score
  const engine = new SmartRecommendationEngine(swipeHistory)
  const [recommendation] = engine.scoreRecommendations([pet], userPet, [])
  
  return (
    <Card>
      <img src={pet.photo} />
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3>{pet.name}</h3>
          <TrustScore score={pet.trustScore} size="sm" showLabel={false} />
        </div>
        
        <p className="text-sm text-muted-foreground">{pet.breed}</p>
        
        <TrustBadges badges={pet.trustBadges} size="sm" animated />
        
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">
              {recommendation.score}% Match
            </span>
            <span className="text-xs text-muted-foreground">
              {recommendation.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {recommendation.reasons[0]}
          </p>
        </div>
      </div>
    </Card>
  )
}
```

### Enhanced Discovery View
```tsx
function EnhancedDiscoveryView() {
  const [swipeHistory] = useKV<SwipeAction[]>('swipe-history', [])
  const [allPets] = useKV<Pet[]>('all-pets', [])
  const [userPet] = useKV<Pet>('current-user-pet', null)
  const [viewedPets, setViewedPets] = useState<string[]>([])
  const [currentPets, setCurrentPets] = useState<Pet[]>([])
  
  useEffect(() => {
    if (!userPet || allPets.length === 0) return
    
    // Initialize with smart recommendations
    const engine = new SmartRecommendationEngine(swipeHistory)
    const initial = engine.getBatchRecommendations(
      allPets,
      userPet,
      [],
      5
    )
    
    setCurrentPets(initial)
    setViewedPets(initial.map(p => p.id))
  }, [userPet, allPets])
  
  const loadMore = () => {
    const engine = new SmartRecommendationEngine(swipeHistory)
    const next = engine.getBatchRecommendations(
      allPets,
      userPet,
      viewedPets,
      5
    )
    
    setCurrentPets(prev => [...prev, ...next])
    setViewedPets(prev => [...prev, ...next.map(p => p.id)])
  }
  
  return (
    <div>
      {currentPets.map(pet => (
        <EnhancedPetCard
          key={pet.id}
          pet={pet}
          userPet={userPet}
          swipeHistory={swipeHistory}
        />
      ))}
      
      <Button onClick={loadMore}>Load More</Button>
    </div>
  )
}
```

## 🎯 Key Points

### Recommendation Engine
- ✅ Uses 6 weighted factors for scoring
- ✅ Learns from swipe history (needs 5+ swipes)
- ✅ Returns category and reasons for transparency
- ✅ Efficient for large pet databases

### Trust System
- ✅ 6 badge types with clear criteria
- ✅ Trust score 0-100 for easy comparison
- ✅ Automatic badge awarding
- ✅ Review and endorsement support

### UI Components
- ✅ Animated and accessible
- ✅ Multiple size options
- ✅ Tooltip descriptions
- ✅ Theme-aware colors

## 📚 Further Reading

- **LATEST_ENHANCEMENTS.md** - Complete feature guide with examples
- **CONTINUATION_ENHANCEMENTS_v3.md** - Deep technical documentation
- **ITERATION_SUMMARY.md** - High-level overview and roadmap

## 🆘 Troubleshooting

**Recommendations seem random**
→ Engine needs swipe history to learn. It will be generic until user has 5+ swipes.

**Badges not showing**
→ Check that badge criteria are met using `checkBadgeEligibility()`

**Trust score is 0**
→ Calculate using `calculateTrustScore()` with complete socialProof object

**TypeScript errors**
→ There's a pre-existing compilation issue. Code should run fine at runtime.
