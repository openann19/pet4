import type {
  AdoptionProfile,
  AdoptionApplication,
  Shelter,
  AdoptionStatus
} from './adoption-types'
import type {
  CommunityPost,
  Comment,
  Reaction,
  SavedPost,
  Follow,
  Report,
  PostMedia,
  PostVideo,
  PostLocation,
  PostMetrics,
  PostModeration,
  PostVisibility,
  ReportReason,
  PostDraft,
  TrendingTag,
  CommunityNotification,
  FeedOptions,
  FeedResponse
} from './community-types'
import type {
  VaccinationRecord,
  HealthRecord,
  VetReminder,
  PetHealthSummary,
  VaccinationType,
  HealthRecordType
} from './health-types'
import type {
  Playdate,
  PlaydateInvitation,
  PlaydateStatus,
  PlaydateType,
  PlaydateLocation
} from './playdate-types'
import type {
  Story,
  StoryView,
  StoryReaction,
  StoryHighlight,
  StoryType,
  StoryVisibility
} from './stories-types'

export function isAdoptionStatus(value: unknown): value is AdoptionStatus {
  return typeof value === 'string' && 
    ['available', 'pending', 'adopted', 'on-hold'].includes(value)
}

export function isAdoptionProfile(value: unknown): value is AdoptionProfile {
  if (typeof value !== 'object' || value === null) return false
  
  const profile = value as Partial<AdoptionProfile>
  
  return typeof profile._id === 'string' &&
    typeof profile.petId === 'string' &&
    typeof profile.petName === 'string' &&
    typeof profile.petPhoto === 'string' &&
    typeof profile.breed === 'string' &&
    typeof profile.age === 'number' &&
    (profile.gender === 'male' || profile.gender === 'female') &&
    ['small', 'medium', 'large', 'extra-large'].includes(profile.size || '') &&
    typeof profile.location === 'string' &&
    typeof profile.shelterId === 'string' &&
    typeof profile.shelterName === 'string' &&
    isAdoptionStatus(profile.status) &&
    typeof profile.description === 'string' &&
    typeof profile.healthStatus === 'string' &&
    typeof profile.vaccinated === 'boolean' &&
    typeof profile.spayedNeutered === 'boolean' &&
    typeof profile.goodWithKids === 'boolean' &&
    typeof profile.goodWithPets === 'boolean' &&
    ['low', 'medium', 'high'].includes(profile.energyLevel || '') &&
    typeof profile.adoptionFee === 'number' &&
    typeof profile.postedDate === 'string' &&
    Array.isArray(profile.personality) &&
    Array.isArray(profile.photos) &&
    typeof profile.contactEmail === 'string'
}

export function isAdoptionProfileArray(value: unknown): value is AdoptionProfile[] {
  return Array.isArray(value) && value.every(isAdoptionProfile)
}

export function isAdoptionApplication(value: unknown): value is AdoptionApplication {
  if (typeof value !== 'object' || value === null) return false
  
  const app = value as Partial<AdoptionApplication>
  
  return typeof app._id === 'string' &&
    typeof app.adoptionProfileId === 'string' &&
    typeof app.applicantId === 'string' &&
    typeof app.applicantName === 'string' &&
    typeof app.applicantEmail === 'string' &&
    typeof app.applicantPhone === 'string' &&
    ['house', 'apartment', 'condo', 'other'].includes(app.householdType || '') &&
    typeof app.hasYard === 'boolean' &&
    typeof app.hasOtherPets === 'boolean' &&
    typeof app.hasChildren === 'boolean' &&
    typeof app.experience === 'string' &&
    typeof app.reason === 'string' &&
    ['pending', 'approved', 'rejected', 'withdrawn'].includes(app.status || '') &&
    typeof app.submittedAt === 'string'
}

export function isAdoptionApplicationArray(value: unknown): value is AdoptionApplication[] {
  return Array.isArray(value) && value.every(isAdoptionApplication)
}

export function isShelter(value: unknown): value is Shelter {
  if (typeof value !== 'object' || value === null) return false
  
  const shelter = value as Partial<Shelter>
  
  return typeof shelter._id === 'string' &&
    typeof shelter.name === 'string' &&
    typeof shelter.location === 'string' &&
    typeof shelter.email === 'string' &&
    typeof shelter.phone === 'string' &&
    typeof shelter.description === 'string' &&
    typeof shelter.verified === 'boolean' &&
    typeof shelter.adoptablePetsCount === 'number'
}

export function isShelterArray(value: unknown): value is Shelter[] {
  return Array.isArray(value) && value.every(isShelter)
}

export function isPostVisibility(value: unknown): value is PostVisibility {
  return typeof value === 'string' && 
    ['public', 'matches', 'private'].includes(value)
}

export function isPostMedia(value: unknown): value is PostMedia {
  if (typeof value !== 'object' || value === null) return false
  
  const media = value as Partial<PostMedia>
  
  return typeof media.id === 'string' &&
    (media.type === 'photo' || media.type === 'video') &&
    typeof media.url === 'string'
}

export function isPostMediaArray(value: unknown): value is PostMedia[] {
  return Array.isArray(value) && value.every(isPostMedia)
}

export function isPostVideo(value: unknown): value is PostVideo {
  if (typeof value !== 'object' || value === null) return false
  
  const video = value as Partial<PostVideo>
  
  return typeof video.id === 'string' &&
    video.type === 'video' &&
    typeof video.url === 'string' &&
    typeof video.duration === 'number'
}

export function isPostLocation(value: unknown): value is PostLocation {
  if (typeof value !== 'object' || value === null) return false
  
  const location = value as Partial<PostLocation>
  
  return typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    typeof location.placeId === 'string' &&
    typeof location.placeName === 'string'
}

export function isPostMetrics(value: unknown): value is PostMetrics {
  if (typeof value !== 'object' || value === null) return false
  
  const metrics = value as Partial<PostMetrics>
  
  return typeof metrics.likes === 'number' &&
    typeof metrics.comments === 'number' &&
    typeof metrics.saves === 'number' &&
    typeof metrics.shares === 'number' &&
    typeof metrics.impressions === 'number'
}

export function isPostModeration(value: unknown): value is PostModeration {
  if (typeof value !== 'object' || value === null) return false
  
  const moderation = value as Partial<PostModeration>
  
  return ['pending', 'auto-flagged', 'approved', 'rejected'].includes(moderation.state || '') &&
    Array.isArray(moderation.reasons)
}

export function isCommunityPost(value: unknown): value is CommunityPost {
  if (typeof value !== 'object' || value === null) return false
  
  const post = value as Partial<CommunityPost>
  
  return typeof post._id === 'string' &&
    typeof post.authorId === 'string' &&
    typeof post.authorName === 'string' &&
    Array.isArray(post.petIds) &&
    typeof post.text === 'string' &&
    isPostMediaArray(post.media) &&
    Array.isArray(post.tags) &&
    isPostVisibility(post.visibility) &&
    typeof post.createdAt === 'string' &&
    typeof post.updatedAt === 'string' &&
    isPostMetrics(post.metrics) &&
    ['active', 'flagged', 'deleted'].includes(post.status || '') &&
    isPostModeration(post.moderation)
}

export function isCommunityPostArray(value: unknown): value is CommunityPost[] {
  return Array.isArray(value) && value.every(isCommunityPost)
}

export function isComment(value: unknown): value is Comment {
  if (typeof value !== 'object' || value === null) return false
  
  const comment = value as Partial<Comment>
  
  return typeof comment._id === 'string' &&
    typeof comment.postId === 'string' &&
    typeof comment.authorId === 'string' &&
    typeof comment.authorName === 'string' &&
    typeof comment.text === 'string' &&
    typeof comment.createdAt === 'string' &&
    typeof comment.updatedAt === 'string' &&
    ['active', 'flagged', 'deleted'].includes(comment.status || '') &&
    typeof comment.metrics === 'object' &&
    comment.metrics !== null &&
    typeof (comment.metrics as { likes?: unknown }).likes === 'number'
}

export function isCommentArray(value: unknown): value is Comment[] {
  return Array.isArray(value) && value.every(isComment)
}

export function isReaction(value: unknown): value is Reaction {
  if (typeof value !== 'object' || value === null) return false
  
  const reaction = value as Partial<Reaction>
  
  return (typeof reaction.id === 'string' || typeof reaction._id === 'string') &&
    typeof reaction.postId === 'string' &&
    typeof reaction.userId === 'string' &&
    typeof reaction.userName === 'string' &&
    typeof reaction.emoji === 'string' &&
    typeof reaction.createdAt === 'string'
}

export function isReactionArray(value: unknown): value is Reaction[] {
  return Array.isArray(value) && value.every(isReaction)
}

export function isSavedPost(value: unknown): value is SavedPost {
  if (typeof value !== 'object' || value === null) return false
  
  const saved = value as Partial<SavedPost>
  
  return typeof saved._id === 'string' &&
    typeof saved.postId === 'string' &&
    typeof saved.userId === 'string' &&
    typeof saved.createdAt === 'string'
}

export function isSavedPostArray(value: unknown): value is SavedPost[] {
  return Array.isArray(value) && value.every(isSavedPost)
}

export function isFollow(value: unknown): value is Follow {
  if (typeof value !== 'object' || value === null) return false
  
  const follow = value as Partial<Follow>
  
  return typeof follow._id === 'string' &&
    typeof follow.followerId === 'string' &&
    typeof follow.targetId === 'string' &&
    typeof follow.targetName === 'string' &&
    ['user', 'tag', 'breed'].includes(follow.type || '') &&
    typeof follow.createdAt === 'string'
}

export function isFollowArray(value: unknown): value is Follow[] {
  return Array.isArray(value) && value.every(isFollow)
}

export function isReportReason(value: unknown): value is ReportReason {
  return typeof value === 'string' && 
    ['spam', 'harassment', 'inappropriate', 'misleading', 'violence', 'hate-speech', 'copyright', 'other'].includes(value)
}

export function isReport(value: unknown): value is Report {
  if (typeof value !== 'object' || value === null) return false
  
  const report = value as Partial<Report>
  
  return ['post', 'comment', 'user'].includes(report.targetType || '') &&
    typeof report.targetId === 'string' &&
    typeof report.reporterId === 'string' &&
    typeof report.reporterName === 'string' &&
    Array.isArray(report.reasons) &&
    report.reasons.every(isReportReason) &&
    typeof report.createdAt === 'string' &&
    ['pending', 'reviewing', 'resolved', 'dismissed'].includes(report.state || '')
}

export function isReportArray(value: unknown): value is Report[] {
  return Array.isArray(value) && value.every(isReport)
}

export function isPostDraft(value: unknown): value is PostDraft {
  if (typeof value !== 'object' || value === null) return false
  
  const draft = value as Partial<PostDraft>
  
  return typeof draft.id === 'string' &&
    typeof draft.text === 'string' &&
    Array.isArray(draft.media) &&
    Array.isArray(draft.petIds) &&
    Array.isArray(draft.tags) &&
    isPostVisibility(draft.visibility) &&
    typeof draft.createdAt === 'string' &&
    typeof draft.updatedAt === 'string'
}

export function isPostDraftArray(value: unknown): value is PostDraft[] {
  return Array.isArray(value) && value.every(isPostDraft)
}

export function isTrendingTag(value: unknown): value is TrendingTag {
  if (typeof value !== 'object' || value === null) return false
  
  const tag = value as Partial<TrendingTag>
  
  return typeof tag.tag === 'string' &&
    typeof tag.count === 'number' &&
    typeof tag.trending === 'boolean'
}

export function isTrendingTagArray(value: unknown): value is TrendingTag[] {
  return Array.isArray(value) && value.every(isTrendingTag)
}

export function isCommunityNotification(value: unknown): value is CommunityNotification {
  if (typeof value !== 'object' || value === null) return false
  
  const notification = value as Partial<CommunityNotification>
  
  return typeof notification.id === 'string' &&
    ['like', 'comment', 'reply', 'follow', 'mention', 'moderation'].includes(notification.type || '') &&
    typeof notification.actorId === 'string' &&
    typeof notification.actorName === 'string' &&
    typeof notification.targetId === 'string' &&
    ['post', 'comment', 'user'].includes(notification.targetType || '') &&
    typeof notification.createdAt === 'string' &&
    typeof notification.read === 'boolean'
}

export function isCommunityNotificationArray(value: unknown): value is CommunityNotification[] {
  return Array.isArray(value) && value.every(isCommunityNotification)
}

export function isFeedOptions(value: unknown): value is FeedOptions {
  if (typeof value !== 'object' || value === null) return false
  
  const options = value as Partial<FeedOptions>
  
  return ['for-you', 'following'].includes(options.mode || '')
}

export function isFeedResponse(value: unknown): value is FeedResponse {
  if (typeof value !== 'object' || value === null) return false
  
  const response = value as Partial<FeedResponse>
  
  return isCommunityPostArray(response.posts) &&
    typeof response.hasMore === 'boolean'
}

export function assertAdoptionProfile(value: unknown): asserts value is AdoptionProfile {
  if (!isAdoptionProfile(value)) {
    throw new TypeError('Value is not a valid AdoptionProfile')
  }
}

export function assertAdoptionApplication(value: unknown): asserts value is AdoptionApplication {
  if (!isAdoptionApplication(value)) {
    throw new TypeError('Value is not a valid AdoptionApplication')
  }
}

export function assertCommunityPost(value: unknown): asserts value is CommunityPost {
  if (!isCommunityPost(value)) {
    throw new TypeError('Value is not a valid CommunityPost')
  }
}

export function assertComment(value: unknown): asserts value is Comment {
  if (!isComment(value)) {
    throw new TypeError('Value is not a valid Comment')
  }
}

export function safeParseAdoptionProfile(value: unknown): AdoptionProfile | null {
  try {
    return isAdoptionProfile(value) ? value : null
  } catch {
    return null
  }
}

export function safeParseAdoptionProfiles(value: unknown): AdoptionProfile[] {
  try {
    return isAdoptionProfileArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseAdoptionApplications(value: unknown): AdoptionApplication[] {
  try {
    return isAdoptionApplicationArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseCommunityPosts(value: unknown): CommunityPost[] {
  try {
    return isCommunityPostArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseComments(value: unknown): Comment[] {
  try {
    return isCommentArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseReactions(value: unknown): Reaction[] {
  try {
    return isReactionArray(value) ? value : []
  } catch {
    return []
  }
}

// Health Types Guards
export function isVaccinationType(value: unknown): value is VaccinationType {
  return typeof value === 'string' && 
    ['rabies', 'distemper', 'parvovirus', 'bordetella', 'leptospirosis', 'lyme', 'influenza', 'other'].includes(value)
}

export function isHealthRecordType(value: unknown): value is HealthRecordType {
  return typeof value === 'string' && 
    ['vaccination', 'checkup', 'illness', 'injury', 'medication', 'surgery', 'dental', 'other'].includes(value)
}

export function isVaccinationRecord(value: unknown): value is VaccinationRecord {
  if (typeof value !== 'object' || value === null) return false
  
  const record = value as Partial<VaccinationRecord>
  
  return typeof record.id === 'string' &&
    typeof record.petId === 'string' &&
    isVaccinationType(record.type) &&
    typeof record.name === 'string' &&
    typeof record.date === 'string' &&
    typeof record.veterinarian === 'string' &&
    typeof record.clinic === 'string' &&
    typeof record.createdAt === 'string'
}

export function isVaccinationRecordArray(value: unknown): value is VaccinationRecord[] {
  return Array.isArray(value) && value.every(isVaccinationRecord)
}

export function isHealthRecord(value: unknown): value is HealthRecord {
  if (typeof value !== 'object' || value === null) return false
  
  const record = value as Partial<HealthRecord>
  
  return typeof record.id === 'string' &&
    typeof record.petId === 'string' &&
    isHealthRecordType(record.type) &&
    typeof record.title === 'string' &&
    typeof record.date === 'string' &&
    typeof record.description === 'string' &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
}

export function isHealthRecordArray(value: unknown): value is HealthRecord[] {
  return Array.isArray(value) && value.every(isHealthRecord)
}

export function isVetReminder(value: unknown): value is VetReminder {
  if (typeof value !== 'object' || value === null) return false
  
  const reminder = value as Partial<VetReminder>
  
  return typeof reminder.id === 'string' &&
    typeof reminder.petId === 'string' &&
    ['vaccination', 'checkup', 'medication', 'other'].includes(reminder.type || '') &&
    typeof reminder.title === 'string' &&
    typeof reminder.dueDate === 'string' &&
    typeof reminder.completed === 'boolean' &&
    typeof reminder.notificationsSent === 'number' &&
    typeof reminder.createdAt === 'string'
}

export function isVetReminderArray(value: unknown): value is VetReminder[] {
  return Array.isArray(value) && value.every(isVetReminder)
}

export function isPetHealthSummary(value: unknown): value is PetHealthSummary {
  if (typeof value !== 'object' || value === null) return false
  
  const summary = value as Partial<PetHealthSummary>
  
  return typeof summary.petId === 'string' &&
    isVaccinationRecordArray(summary.upcomingVaccinations) &&
    isVetReminderArray(summary.activeReminders) &&
    isHealthRecordArray(summary.recentRecords) &&
    ['up-to-date', 'due-soon', 'overdue'].includes(summary.vaccinationStatus || '')
}

// Playdate Types Guards
export function isPlaydateStatus(value: unknown): value is PlaydateStatus {
  return typeof value === 'string' && 
    ['pending', 'confirmed', 'completed', 'cancelled'].includes(value)
}

export function isPlaydateType(value: unknown): value is PlaydateType {
  return typeof value === 'string' && 
    ['park', 'walk', 'playdate', 'training', 'event', 'other'].includes(value)
}

export function isPlaydateLocation(value: unknown): value is PlaydateLocation {
  if (typeof value !== 'object' || value === null) return false
  
  const location = value as Partial<PlaydateLocation>
  
  return typeof location.name === 'string' &&
    typeof location.address === 'string'
}

export function isPlaydate(value: unknown): value is Playdate {
  if (typeof value !== 'object' || value === null) return false
  
  const playdate = value as Partial<Playdate>
  
  return typeof playdate.id === 'string' &&
    typeof playdate.matchId === 'string' &&
    Array.isArray(playdate.petIds) &&
    Array.isArray(playdate.ownerIds) &&
    typeof playdate.title === 'string' &&
    isPlaydateType(playdate.type) &&
    typeof playdate.date === 'string' &&
    typeof playdate.startTime === 'string' &&
    typeof playdate.endTime === 'string' &&
    isPlaydateLocation(playdate.location) &&
    isPlaydateStatus(playdate.status) &&
    typeof playdate.createdBy === 'string' &&
    typeof playdate.reminderSent === 'boolean' &&
    typeof playdate.createdAt === 'string' &&
    typeof playdate.updatedAt === 'string'
}

export function isPlaydateArray(value: unknown): value is Playdate[] {
  return Array.isArray(value) && value.every(isPlaydate)
}

export function isPlaydateInvitation(value: unknown): value is PlaydateInvitation {
  if (typeof value !== 'object' || value === null) return false
  
  const invitation = value as Partial<PlaydateInvitation>
  
  return typeof invitation.id === 'string' &&
    typeof invitation.playdateId === 'string' &&
    typeof invitation.recipientId === 'string' &&
    typeof invitation.senderId === 'string' &&
    ['pending', 'accepted', 'declined'].includes(invitation.status || '') &&
    typeof invitation.createdAt === 'string'
}

export function isPlaydateInvitationArray(value: unknown): value is PlaydateInvitation[] {
  return Array.isArray(value) && value.every(isPlaydateInvitation)
}

// Story Types Guards
export function isStoryType(value: unknown): value is StoryType {
  return typeof value === 'string' && 
    ['photo', 'video', 'gif', 'boomerang'].includes(value)
}

export function isStoryVisibility(value: unknown): value is StoryVisibility {
  return typeof value === 'string' && 
    ['everyone', 'matches-only', 'close-friends'].includes(value)
}

export function isStoryView(value: unknown): value is StoryView {
  if (typeof value !== 'object' || value === null) return false
  
  const view = value as Partial<StoryView>
  
  return typeof view.userId === 'string' &&
    typeof view.userName === 'string' &&
    typeof view.viewedAt === 'string' &&
    typeof view.viewDuration === 'number' &&
    typeof view.completedView === 'boolean'
}

export function isStoryViewArray(value: unknown): value is StoryView[] {
  return Array.isArray(value) && value.every(isStoryView)
}

export function isStoryReaction(value: unknown): value is StoryReaction {
  if (typeof value !== 'object' || value === null) return false
  
  const reaction = value as Partial<StoryReaction>
  
  return typeof reaction.userId === 'string' &&
    typeof reaction.userName === 'string' &&
    typeof reaction.emoji === 'string' &&
    typeof reaction.timestamp === 'string'
}

export function isStoryReactionArray(value: unknown): value is StoryReaction[] {
  return Array.isArray(value) && value.every(isStoryReaction)
}

export function isStory(value: unknown): value is Story {
  if (typeof value !== 'object' || value === null) return false
  
  const story = value as Partial<Story>
  
  return typeof story.id === 'string' &&
    typeof story.userId === 'string' &&
    typeof story.userName === 'string' &&
    typeof story.petId === 'string' &&
    typeof story.petName === 'string' &&
    typeof story.petPhoto === 'string' &&
    isStoryType(story.type) &&
    typeof story.mediaUrl === 'string' &&
    typeof story.duration === 'number' &&
    typeof story.createdAt === 'string' &&
    typeof story.expiresAt === 'string' &&
    isStoryVisibility(story.visibility) &&
    typeof story.viewCount === 'number' &&
    isStoryViewArray(story.views) &&
    isStoryReactionArray(story.reactions)
}

export function isStoryArray(value: unknown): value is Story[] {
  return Array.isArray(value) && value.every(isStory)
}

export function isStoryHighlight(value: unknown): value is StoryHighlight {
  if (typeof value !== 'object' || value === null) return false
  
  const highlight = value as Partial<StoryHighlight>
  
  return typeof highlight.id === 'string' &&
    typeof highlight.userId === 'string' &&
    typeof highlight.petId === 'string' &&
    typeof highlight.title === 'string' &&
    typeof highlight.coverImage === 'string' &&
    isStoryArray(highlight.stories) &&
    typeof highlight.createdAt === 'string' &&
    typeof highlight.updatedAt === 'string' &&
    typeof highlight.isPinned === 'boolean'
}

export function isStoryHighlightArray(value: unknown): value is StoryHighlight[] {
  return Array.isArray(value) && value.every(isStoryHighlight)
}

// Safe parse functions for new types
export function safeParseVaccinationRecords(value: unknown): VaccinationRecord[] {
  try {
    return isVaccinationRecordArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseHealthRecords(value: unknown): HealthRecord[] {
  try {
    return isHealthRecordArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseVetReminders(value: unknown): VetReminder[] {
  try {
    return isVetReminderArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParsePlaydates(value: unknown): Playdate[] {
  try {
    return isPlaydateArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParsePlaydateInvitations(value: unknown): PlaydateInvitation[] {
  try {
    return isPlaydateInvitationArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseStories(value: unknown): Story[] {
  try {
    return isStoryArray(value) ? value : []
  } catch {
    return []
  }
}

export function safeParseStoryHighlights(value: unknown): StoryHighlight[] {
  try {
    return isStoryHighlightArray(value) ? value : []
  } catch {
    return []
  }
}

// Assertion functions for new types
export function assertVaccinationRecord(value: unknown): asserts value is VaccinationRecord {
  if (!isVaccinationRecord(value)) {
    throw new TypeError('Value is not a valid VaccinationRecord')
  }
}

export function assertHealthRecord(value: unknown): asserts value is HealthRecord {
  if (!isHealthRecord(value)) {
    throw new TypeError('Value is not a valid HealthRecord')
  }
}

export function assertPlaydate(value: unknown): asserts value is Playdate {
  if (!isPlaydate(value)) {
    throw new TypeError('Value is not a valid Playdate')
  }
}

export function assertStory(value: unknown): asserts value is Story {
  if (!isStory(value)) {
    throw new TypeError('Value is not a valid Story')
  }
}
