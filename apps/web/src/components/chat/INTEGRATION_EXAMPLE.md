// Example integration in AdvancedChatWindow.tsx
// Add this import at the top:
// import { BubbleWrapperGodTier, AnimatedAIWrapper, PresenceGlow } from './bubble-wrapper-god-tier'
// import { useParticleBurstOnEvent } from './bubble-wrapper-god-tier/effects/useParticleBurstOnEvent'

// Example usage in message rendering:
/*
{messages.map((message, index) => {
  const isCurrentUser = message.senderId === currentUserId
  const isAIMessage = message.senderId === 'ai' || message.senderId === 'bot'
  
  return (
    <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <PresenceGlow isActive={true}>
          <Avatar>
            <AvatarImage src={message.senderAvatar} />
          </Avatar>
        </PresenceGlow>
      )}
      
      <BubbleWrapperGodTier
        isAIMessage={isAIMessage}
        messageText={message.content}
        timestamp={message.createdAt}
        enabled={true}
      >
        <div className={`rounded-2xl p-3 ${isCurrentUser ? 'bg-primary text-white' : 'bg-card'}`}>
          {isAIMessage ? (
            <AnimatedAIWrapper>
              {message.content}
            </AnimatedAIWrapper>
          ) : (
            message.content
          )}
        </div>
      </BubbleWrapperGodTier>
    </div>
  )
})}
*/

// For send events, add particle burst:
/*
const particleBurst = useParticleBurstOnEvent({ enabled: true })

const handleSendMessage = async (content: string) => {
  // ... existing send logic ...
  
  // Trigger send particle effect
  if (sendButtonRef.current) {
    const rect = sendButtonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    particleBurst.triggerBurst('send', centerX, centerY)
  }
}
*/

