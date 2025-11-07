#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const files = readFileSync('/tmp/motion-files.txt', 'utf-8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map(f => f.replace(/^\.\//, ''));

const checkMigration = (filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const hasFramer = /from ['"]framer-motion['"]|from ['"]@petspark\/motion['"]|MotionView|MotionText|AnimatePresence|motion\./.test(content);
    const hasReanimated = /from ['"]react-native-reanimated['"]|useSharedValue|useAnimatedStyle|AnimatedView|withSpring|withTiming/.test(content);
    
    if (hasFramer && hasReanimated) {
      return 'partial';
    }
    if (hasFramer && !hasReanimated) {
      return 'needsMigration';
    }
    if (!hasFramer && hasReanimated) {
      return 'migrated';
    }
    return 'unknown';
  } catch (e) {
    return 'error';
  }
};

const categorizeFile = (filePath) => {
  if (filePath.includes('.native.')) {
    return 'native';
  }
  if (filePath.includes('effects/reanimated/')) {
    return 'infrastructure';
  }
  
  return checkMigration(filePath);
};

const categorized = {
  migrated: [],
  needsMigration: [],
  partial: [],
  infrastructure: [],
  native: [],
  errors: []
};

files.forEach(file => {
  const category = categorizeFile(file);
  if (categorized[category]) {
    categorized[category].push(file);
  } else {
    categorized.errors.push(file);
  }
});

const groupByFeature = (files) => {
  const groups = {
    auth: [],
    adoption: [],
    admin: [],
    chat: [],
    community: [],
    enhanced: [],
    stories: [],
    verification: [],
    playdate: [],
    maps: [],
    lostFound: [],
    views: [],
    notifications: [],
    streaming: [],
    ui: [],
    other: []
  };
  
  files.forEach(file => {
    const path = file.toLowerCase();
    if (path.includes('/auth/')) groups.auth.push(file);
    else if (path.includes('/adoption/')) groups.adoption.push(file);
    else if (path.includes('/admin/')) groups.admin.push(file);
    else if (path.includes('/chat/')) groups.chat.push(file);
    else if (path.includes('/community/')) groups.community.push(file);
    else if (path.includes('/enhanced/')) groups.enhanced.push(file);
    else if (path.includes('/stories/')) groups.stories.push(file);
    else if (path.includes('/verification/')) groups.verification.push(file);
    else if (path.includes('/playdate/')) groups.playdate.push(file);
    else if (path.includes('/maps/')) groups.maps.push(file);
    else if (path.includes('/lost-found/')) groups.lostFound.push(file);
    else if (path.includes('/views/')) groups.views.push(file);
    else if (path.includes('/notifications/')) groups.notifications.push(file);
    else if (path.includes('/streaming/')) groups.streaming.push(file);
    else if (path.includes('/ui/')) groups.ui.push(file);
    else groups.other.push(file);
  });
  
  return groups;
};

const report = {
  summary: {
    total: files.length,
    migrated: categorized.migrated.length,
    needsMigration: categorized.needsMigration.length,
    partial: categorized.partial.length,
    infrastructure: categorized.infrastructure.length,
    native: categorized.native.length,
    errors: categorized.errors.length
  },
  byStatus: categorized,
  byFeature: {
    migrated: groupByFeature(categorized.migrated),
    needsMigration: groupByFeature(categorized.needsMigration),
    partial: groupByFeature(categorized.partial)
  }
};

writeFileSync('FRAMER_MOTION_AUDIT_REPORT.json', JSON.stringify(report, null, 2));
console.log('Summary:');
console.log(JSON.stringify(report.summary, null, 2));
console.log('\nFull report saved to FRAMER_MOTION_AUDIT_REPORT.json');
