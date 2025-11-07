#!/usr/bin/env node
/**
 * Framer Motion Migration File Categorizer
 * 
 * Categorizes all files that need migration from Framer Motion to React Reanimated
 * Generates a detailed breakdown by category and priority
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const CATEGORIES = {
  // Core Components
  'CreatePetDialog.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 5 },
  'AuthScreen.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'ChatWindowNew.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 4 },
  'PetDetailDialog.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'MatchCelebration.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 5 },
  'WelcomeScreen.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'LoadingState.tsx': { priority: 'P1', complexity: 'Low', estimatedHours: 2 },
  'WelcomeModal.tsx': { priority: 'P1', complexity: 'Low', estimatedHours: 2 },
  
  // Views
  'MatchesView.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 4 },
  'AdoptionView.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'AdoptionMarketplaceView.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'LostFoundView.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'MapView.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'NotificationsView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'SavedPostsView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'UserPostsView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  
  // Stories
  'CreateStoryDialog.tsx': { priority: 'P1', complexity: 'High', estimatedHours: 4 },
  'StoriesBar.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'HighlightsBar.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'StoryRing.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'HighlightViewer.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'CreateHighlightDialog.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'SaveToHighlightDialog.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  'StoryFilterSelector.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  'StoryTemplateSelector.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  
  // Admin
  'DashboardView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'UsersView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'AuditLogView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ContentView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ModerationQueue.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ReportsView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'KYCManagement.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'PerformanceMonitoring.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'VerificationReviewDashboard.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ContentModerationQueue.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ChatModerationPanel.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  
  // Enhanced Components
  'EnhancedPetDetailView.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 5 },
  'EnhancedCarousel.tsx': { priority: 'P0', complexity: 'High', estimatedHours: 4 },
  'EnhancedCard.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'EnhancedButton.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'UltraButton.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'PremiumCard.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'SmartSearch.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'NotificationCenter.tsx': { priority: 'P0', complexity: 'Medium', estimatedHours: 3 },
  'DetailedPetAnalytics.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'AnimatedBadge.tsx': { priority: 'P1', complexity: 'Low', estimatedHours: 2 },
  'SmartToast.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'TrustBadges.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ProgressiveImage.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'AdvancedCard.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  
  // Adoption
  'AdoptionDetailDialog.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'AdoptionListingCard.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'AdoptionListingDetailDialog.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'CreateAdoptionListingWizard.tsx': { priority: 'P1', complexity: 'High', estimatedHours: 4 },
  'MyApplicationsView.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  
  // Verification
  'VerificationDialog.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'VerificationButton.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  'DocumentUploadCard.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'VerificationLevelSelector.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  'VerificationBadge.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  
  // Playdate
  'PlaydateMap.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'PlaydateScheduler.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'LocationPicker.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  
  // Maps
  'LostFoundMap.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'VenuePicker.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  'LocationSharing.tsx': { priority: 'P2', complexity: 'Medium', estimatedHours: 3 },
  
  // Community
  'PostComposer.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'CommentsSheet.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'ReportDialog.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  'RankingSkeleton.tsx': { priority: 'P2', complexity: 'Low', estimatedHours: 2 },
  
  // Auth
  'SignInForm.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'SignUpForm.tsx': { priority: 'P1', complexity: 'Medium', estimatedHours: 3 },
  'OAuthButtons.tsx': { priority: 'P1', complexity: 'Low', estimatedHours: 2 },
  'AgeGateModal.tsx': { priority: 'P1', complexity: 'Low', estimatedHours: 2 },
}

function categorizeFile(filePath) {
  const fileName = filePath.split('/').pop() ?? ''
  const baseName = fileName.replace('.tsx', '').replace('.native.tsx', '')
  
  // Get category from path
  let category = 'Other Components'
  if (filePath.includes('/admin/')) category = 'Admin Panels'
  else if (filePath.includes('/adoption/')) category = 'Adoption'
  else if (filePath.includes('/auth/')) category = 'Auth'
  else if (filePath.includes('/chat/')) category = 'Chat Components'
  else if (filePath.includes('/community/')) category = 'Community'
  else if (filePath.includes('/enhanced/')) category = 'Enhanced Components'
  else if (filePath.includes('/maps/')) category = 'Maps'
  else if (filePath.includes('/playdate/')) category = 'Playdate'
  else if (filePath.includes('/stories/')) category = 'Stories'
  else if (filePath.includes('/verification/')) category = 'Verification'
  else if (filePath.includes('/views/')) category = 'Views'
  else if (filePath.includes('/lost-found/')) category = 'Lost & Found'
  else if (filePath.includes('/streaming/')) category = 'Streaming'
  else if (filePath.includes('/notifications/')) category = 'Notifications'
  else if (fileName === 'CreatePetDialog.tsx' || fileName === 'AuthScreen.tsx' || 
           fileName === 'ChatWindowNew.tsx' || fileName === 'PetDetailDialog.tsx' ||
           fileName === 'MatchCelebration.tsx' || fileName === 'WelcomeScreen.tsx' ||
           fileName === 'LoadingState.tsx' || fileName === 'WelcomeModal.tsx') {
    category = 'Core Components'
  }
  
  const fileInfo = CATEGORIES[fileName] ?? CATEGORIES[baseName + '.tsx'] ?? {
    priority: 'P2',
    complexity: 'Medium',
    estimatedHours: 3
  }
  
  return {
    category,
    info: {
      path: filePath,
      category,
      ...fileInfo
    }
  }
}

function main() {
  try {
    // Get list of files needing migration
    const filesOutput = execSync(
      "find apps/web/src/components -name '*.tsx' -type f -exec grep -l \"from ['\\\"]framer-motion['\\\"]\\|from ['\\\"]@petspark/motion['\\\"]\\|MotionView\\|MotionText\\|AnimatePresence\\|motion\\.\" {} \\; | sort",
      { encoding: 'utf-8', cwd: process.cwd() }
    )
    
    const files = filesOutput.trim().split('\n').filter(Boolean)
    
    // Categorize files
    const categorized = {}
    const byPriority = {
      P0: [],
      P1: [],
      P2: []
    }
    
    for (const file of files) {
      const { category, info } = categorizeFile(file)
      
      if (!categorized[category]) {
        categorized[category] = []
      }
      categorized[category].push(info)
      byPriority[info.priority].push(info)
    }
    
    // Generate report
    let report = '# Framer Motion Migration - Detailed File List\n\n'
    report += `**Generated**: ${new Date().toISOString()}\n`
    report += `**Total Files**: ${files.length}\n\n`
    
    // Summary by category
    report += '## Summary by Category\n\n'
    report += '| Category | Count | P0 | P1 | P2 | Est. Hours |\n'
    report += '|----------|-------|----|----|----|------------|\n'
    
    for (const [category, fileList] of Object.entries(categorized).sort()) {
      const p0 = fileList.filter(f => f.priority === 'P0').length
      const p1 = fileList.filter(f => f.priority === 'P1').length
      const p2 = fileList.filter(f => f.priority === 'P2').length
      const totalHours = fileList.reduce((sum, f) => sum + f.estimatedHours, 0)
      report += `| ${category} | ${fileList.length} | ${p0} | ${p1} | ${p2} | ${totalHours} |\n`
    }
    
    // Detailed list by category
    report += '\n## Files by Category\n\n'
    
    for (const [category, fileList] of Object.entries(categorized).sort()) {
      report += `### ${category} (${fileList.length} files)\n\n`
      
      for (const file of fileList.sort((a, b) => {
        const priorityOrder = { P0: 0, P1: 1, P2: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return a.path.localeCompare(b.path)
      })) {
        report += `- \`${file.path}\`\n`
        report += `  - Priority: ${file.priority} | Complexity: ${file.complexity} | Est. Hours: ${file.estimatedHours}\n`
      }
      
      report += '\n'
    }
    
    // Files by priority
    report += '## Files by Priority\n\n'
    
    for (const priority of ['P0', 'P1', 'P2']) {
      const fileList = byPriority[priority]
      report += `### ${priority} - ${fileList.length} files\n\n`
      
      for (const file of fileList.sort((a, b) => a.path.localeCompare(b.path))) {
        report += `- \`${file.path}\` (${file.category}, ${file.complexity}, ${file.estimatedHours}h)\n`
      }
      
      report += '\n'
    }
    
    // Write report
    writeFileSync('FRAMER_MOTION_MIGRATION_DETAILED.md', report)
    
    console.log(`✅ Generated migration report: FRAMER_MOTION_MIGRATION_DETAILED.md`)
    console.log(`   Total files: ${files.length}`)
    console.log(`   Categories: ${Object.keys(categorized).length}`)
    console.log(`   P0: ${byPriority.P0.length} files`)
    console.log(`   P1: ${byPriority.P1.length} files`)
    console.log(`   P2: ${byPriority.P2.length} files`)
    
  } catch (error) {
    console.error('Error generating report:', error)
    process.exit(1)
  }
}

main()

