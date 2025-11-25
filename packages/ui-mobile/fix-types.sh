#!/bin/bash

# Fix TypeScript errors in ui-mobile package

cd /home/ben/Public/PETSPARK/packages/ui-mobile

echo "Fixing component size and variant defaults..."

# Fix default config values from invalid enums to valid ones
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/variant: '\''primary'\''/variant: '\''default'\''/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/variant: '\''secondary'\''/variant: '\''outlined'\''/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/size: '\''md'\''/size: '\''medium'\''/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/size: '\''sm'\''/size: '\''small'\''/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/size: '\''lg'\''/size: '\''large'\''/g'

echo "Fixing component size comparisons..."

# Fix size comparisons
find src -name "*.tsx" | xargs sed -i 's/size === '\''sm'\''/size === '\''small'\''/g'
find src -name "*.tsx" | xargs sed -i 's/size === '\''md'\''/size === '\''medium'\''/g'
find src -name "*.tsx" | xargs sed -i 's/size === '\''lg'\''/size === '\''large'\''/g'

echo "Fixing variant comparisons..."

# Fix variant comparisons
find src -name "*.tsx" | xargs sed -i 's/variant === '\''primary'\''/variant === '\''default'\''/g'
find src -name "*.tsx" | xargs sed -i 's/variant === '\''secondary'\''/variant === '\''outlined'\''/g'

echo "Fixing case statements..."

# Fix case statements
find src -name "*.tsx" | xargs sed -i 's/case '\''primary'\''/case '\''default'\''/g'
find src -name "*.tsx" | xargs sed -i 's/case '\''secondary'\''/case '\''outlined'\''/g'

echo "Complete!"
