import { motion } from '@petspark/motion'
import { 
  ShieldCheck, 
  Syringe, 
  Certificate, 
  MagnifyingGlass, 
  Medal, 
  ChalkboardTeacher,
  HandHeart,
  Star,
  Fire,
  Crown
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TrustBadge } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrustBadgesProps {
  badges: TrustBadge[]
  compact?: boolean
  showLabels?: boolean
}

const badgeIcons: Record<TrustBadge['type'], any> = {
  verified_owner: ShieldCheck,
  vaccinated: Syringe,
  health_certified: Certificate,
  background_check: MagnifyingGlass,
  experienced_owner: Medal,
  trainer_approved: ChalkboardTeacher,
  rescue_supporter: HandHeart,
  community_favorite: Star,
  active_member: Fire,
  top_rated: Crown,
}

const badgeColors: Record<TrustBadge['type'], string> = {
  verified_owner: 'text-primary bg-primary/10 border-primary/30',
  vaccinated: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  health_certified: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
  background_check: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
  experienced_owner: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  trainer_approved: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  rescue_supporter: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
  community_favorite: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  active_member: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30',
  top_rated: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/30',
}

export function TrustBadges({ badges, compact = false, showLabels = false }: TrustBadgesProps) {
  if (!badges || badges.length === 0) return null

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-wrap gap-2",
        compact && "gap-1.5"
      )}>
        {badges.map((badge, index) => {
          const Icon = badgeIcons[badge.type]
          const colorClass = badgeColors[badge.type]

          if (showLabels) {
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <MotionView
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 transition-all duration-300 hover:scale-105 cursor-default",
                        colorClass
                      )}
                    >
                      <Icon size={14} weight="bold" />
                      <span className="text-xs font-medium">{badge.label}</span>
                    </Badge>
                  </MotionView>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <MotionView
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center justify-center w-8 h-8 p-0 rounded-full transition-all duration-300 hover:scale-110 cursor-default",
                      compact && "w-7 h-7",
                      colorClass
                    )}
                  >
                    <Icon size={compact ? 14 : 16} weight="bold" />
                  </Badge>
                </MotionView>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
