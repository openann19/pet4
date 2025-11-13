export type RootTabParamList = {
  Feed: undefined
  Chat: { chatId?: string; matchId?: string } | undefined
  Matches: { matchId?: string } | undefined
  Adopt: { petId?: string; listingId?: string } | undefined
  Community: { postId?: string; userId?: string } | undefined
  Profile: { petId?: string; userId?: string } | undefined
}
