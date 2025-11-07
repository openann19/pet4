# API Configuration Guide

This document explains how to configure external service integrations through the Admin Console.

## Overview

All external API configurations are managed centrally through the Admin Console's **API Configuration** section. This includes:

- Maps Service (Google Maps, Mapbox, OpenStreetMap)
- AI Service (Spark AI, OpenAI, Anthropic)
- KYC/Identity Verification (Manual, Stripe Identity, Onfido, Jumio)
- Photo Moderation (Spark, OpenAI Vision, Google Cloud Vision, AWS Rekognition)
- SMS Service (Twilio, Vonage, AWS SNS)
- Email Service (SendGrid, Mailgun, AWS SES)
- Storage Service (Local, AWS S3, Cloudflare R2)
- Analytics Service (Google Analytics, Mixpanel, Amplitude)

## Accessing API Configuration

1. Navigate to the Admin Console (click the shield icon in the header)
2. Select **API Configuration** from the sidebar menu
3. Choose the service you want to configure from the tabs

## Configuration by Service

### Maps Service

Configure the map provider for location-based features.

**Providers:**
- **OpenStreetMap** (Free, no API key required)
- **Google Maps** (Requires API key)
- **Mapbox** (Requires API key)

**Settings:**
- Provider selection
- API Key (if applicable)
- Rate Limit (requests per minute)

**Usage in Code:**
```typescript
import { getMapsConfig } from '@/lib/api-config'

const mapsConfig = await getMapsConfig()
if (mapsConfig?.enabled) {
  const apiKey = mapsConfig.apiKey
  const provider = mapsConfig.provider
  // Initialize map with configuration
}
```

### AI Service

Configure AI provider for matching algorithms and pet analysis.

**Providers:**
- **Spark AI** (Included, no API key required)
- **OpenAI** (Requires API key)
- **Anthropic** (Requires API key)

**Settings:**
- Provider selection
- API Key (if applicable)
- Model selection (GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet)
- Max Tokens
- Temperature (0.0 - 2.0)

**Usage in Code:**
```typescript
import { getAIConfig } from '@/lib/api-config'

const aiConfig = await getAIConfig()
if (aiConfig?.enabled) {
  if (aiConfig.provider === 'spark') {
    // Use built-in Spark AI
    const prompt = window.spark.llmPrompt`Generate pet description for ${petData}`
    const result = await window.spark.llm(prompt, aiConfig.model)
  } else {
    // Use external provider with API key
    const apiKey = aiConfig.apiKey
    // Make API call to external provider
  }
}
```

### KYC / Identity Verification

Configure identity verification service for user validation.

**Providers:**
- **Manual Review** (No API key required)
- **Stripe Identity** (Requires API key)
- **Onfido** (Requires API key)
- **Jumio** (Requires API key)

**Settings:**
- Provider selection
- API Key (if applicable)
- Auto-approve successful verifications
- Require identity documents

**Usage in Code:**
```typescript
import { getKYCConfig } from '@/lib/api-config'

const kycConfig = await getKYCConfig()
if (kycConfig?.enabled) {
  if (kycConfig.provider === 'manual') {
    // Queue for manual review
  } else {
    // Integrate with external KYC provider
    const apiKey = kycConfig.apiKey
    const autoApprove = kycConfig.autoApprove
  }
}
```

### Photo Moderation

Configure automated content moderation for uploaded photos.

**Providers:**
- **Spark Moderation** (Included, no API key required)
- **OpenAI Vision** (Requires API key)
- **Google Cloud Vision** (Requires API key)
- **AWS Rekognition** (Requires API key)

**Settings:**
- Provider selection
- API Key (if applicable)
- Confidence Threshold (0.0 - 1.0)
- Auto-reject violations

**Usage in Code:**
```typescript
import { getPhotoModerationConfig } from '@/lib/api-config'

const moderationConfig = await getPhotoModerationConfig()
if (moderationConfig?.enabled) {
  const threshold = moderationConfig.confidenceThreshold
  const autoReject = moderationConfig.autoReject
  
  // Analyze photo
  const result = await analyzePhoto(photoUrl, moderationConfig)
  if (result.confidence > threshold && result.inappropriate) {
    if (autoReject) {
      // Automatically reject
    } else {
      // Queue for manual review
    }
  }
}
```

### SMS Service

Configure SMS provider for notifications and verification codes.

**Providers:**
- **Disabled** (No SMS features)
- **Twilio** (Requires API key and auth token)
- **Vonage** (Nexmo) (Requires API key and secret)
- **AWS SNS** (Requires API key and secret)

**Settings:**
- Provider selection
- API Key / Account SID
- API Secret / Auth Token
- From Number

**Usage in Code:**
```typescript
import { getSMSConfig } from '@/lib/api-config'

const smsConfig = await getSMSConfig()
if (smsConfig?.enabled && smsConfig.provider !== 'disabled') {
  const apiKey = smsConfig.apiKey
  const apiSecret = smsConfig.apiSecret
  const fromNumber = smsConfig.fromNumber
  
  // Send SMS
  await sendSMS({
    to: userPhoneNumber,
    from: fromNumber,
    message: 'Your verification code is: 123456'
  })
}
```

### Email Service

Configure email provider for notifications and alerts.

**Providers:**
- **Disabled** (No email features)
- **SendGrid** (Requires API key)
- **Mailgun** (Requires API key)
- **AWS SES** (Requires API key)

**Settings:**
- Provider selection
- API Key
- From Email
- From Name

**Usage in Code:**
```typescript
import { getEmailConfig } from '@/lib/api-config'

const emailConfig = await getEmailConfig()
if (emailConfig?.enabled && emailConfig.provider !== 'disabled') {
  const apiKey = emailConfig.apiKey
  const fromEmail = emailConfig.fromEmail
  const fromName = emailConfig.fromName
  
  // Send email
  await sendEmail({
    to: userEmail,
    from: { email: fromEmail, name: fromName },
    subject: 'Welcome to PawfectMatch!',
    html: emailTemplate
  })
}
```

### Storage Service

Configure file and image storage provider.

**Providers:**
- **Local Storage** (No API key required)
- **AWS S3** (Requires access key and secret)
- **Cloudflare R2** (Requires access key and secret)

**Settings:**
- Provider selection
- Access Key ID
- Secret Access Key
- Bucket Name
- Region

**Usage in Code:**
```typescript
import { getStorageConfig } from '@/lib/api-config'

const storageConfig = await getStorageConfig()
if (storageConfig?.enabled) {
  if (storageConfig.provider === 'local') {
    // Store locally
  } else {
    // Store in cloud
    const accessKey = storageConfig.apiKey
    const secretKey = storageConfig.apiSecret
    const bucket = storageConfig.bucket
    const region = storageConfig.region
    
    // Upload to S3/R2
    await uploadToCloud(file, { accessKey, secretKey, bucket, region })
  }
}
```

### Analytics Service

Configure user analytics and tracking.

**Providers:**
- **Disabled** (No analytics)
- **Google Analytics** (Requires Measurement ID)
- **Mixpanel** (Requires API key)
- **Amplitude** (Requires API key)

**Settings:**
- Provider selection
- API Key / Measurement ID

**Usage in Code:**
```typescript
import { getAnalyticsConfig } from '@/lib/api-config'

const analyticsConfig = await getAnalyticsConfig()
if (analyticsConfig?.enabled && analyticsConfig.provider !== 'disabled') {
  const apiKey = analyticsConfig.apiKey
  
  // Track event
  trackEvent('user_matched', {
    petId: petId,
    timestamp: Date.now()
  })
}
```

## Security Best Practices

1. **Never commit API keys to version control** - All keys are stored securely in Spark's KV storage
2. **Use environment-specific keys** - Configure different keys for development, staging, and production
3. **Rotate keys regularly** - Update API keys periodically for security
4. **Use least privilege** - Configure API keys with minimal required permissions
5. **Monitor usage** - Regularly check API usage and rate limits
6. **Test connections** - Use the "Test Connection" button to verify configuration

## Testing Configuration

Each service configuration includes a "Test Connection" button that:
- Validates API credentials
- Checks connectivity to the service
- Verifies permissions
- Reports any configuration errors

## Helper Functions

The `api-config.ts` library provides convenient helper functions:

```typescript
// Get full configuration
const config = await getAPIConfig()

// Get specific service config
const mapsConfig = await getMapsConfig()
const aiConfig = await getAIConfig()
const kycConfig = await getKYCConfig()
const moderationConfig = await getPhotoModerationConfig()
const smsConfig = await getSMSConfig()
const emailConfig = await getEmailConfig()
const storageConfig = await getStorageConfig()
const analyticsConfig = await getAnalyticsConfig()

// Check if service is enabled
const isEnabled = isServiceEnabled('ai', config)

// Get API key for service
const apiKey = getAPIKey('maps', config)
```

## Default Configuration

On first load, services are configured with safe defaults:
- **Maps**: OpenStreetMap (free, no key required)
- **AI**: Spark AI (included, no key required)
- **KYC**: Manual review
- **Photo Moderation**: Spark moderation (included)
- **SMS**: Disabled
- **Email**: Disabled
- **Storage**: Local storage
- **Analytics**: Disabled

## Resetting Configuration

Each service has a "Reset" button that restores default settings. Use this if:
- You want to start fresh with a service
- Configuration becomes corrupted
- You need to quickly disable a service

## Troubleshooting

### Service Not Working
1. Check that the service is enabled in API Configuration
2. Verify API key is correct (use "Test Connection")
3. Check rate limits haven't been exceeded
4. Verify required permissions are granted

### Test Connection Fails
1. Verify API key is correct and active
2. Check network connectivity
3. Ensure API key has required permissions
4. Verify the provider service is operational

### Changes Not Applying
1. Configuration changes are saved automatically
2. Some changes may require app reload
3. Check browser console for errors
4. Verify you have admin permissions

## Support

For issues with:
- **Spark AI**: Included in platform, no additional support needed
- **Third-party services**: Contact respective provider's support
- **Configuration issues**: Check this documentation or contact platform admin
