# Third-Party API Requirements Analysis

## Summary

**Total API Services Configured:** 9

**Minimum Required (Using Internal/Free Options):** 1 (LiveKit)
**Maximum Required (All Premium Features):** 9 services

---

## ✅ **Services with Internal/Free Options (No 3rd Party Required)**

### 1. **Maps** (3 options)
- ✅ **OpenStreetMap** - Free, no API key required (default)
- ❌ Google Maps - Requires API key ($200/month free tier)
- ❌ Mapbox - Requires API key ($0-49k/month)

### 2. **AI** (3 options)
- ✅ **Spark AI** - Internal, included (default)
- ❌ OpenAI - Requires API key ($5-500/month)
- ❌ Anthropic - Requires API key ($15-300/month)

### 3. **KYC / Identity Verification** (4 options)
- ✅ **Manual Review** - Internal, no API needed (default)
- ❌ Stripe Identity - Requires Stripe account ($0.50-1.50 per check)
- ❌ Onfido - Requires API key ($1-2 per check)
- ❌ Jumio - Requires API key ($1-3 per check)

### 4. **Photo Moderation** (4 options)
- ✅ **Spark Moderation** - Internal, included (default)
- ❌ OpenAI Vision - Requires API key ($0.01-0.03 per image)
- ❌ Google Cloud Vision - Requires API key ($1.50 per 1000 images)
- ❌ AWS Rekognition - Requires AWS account ($1.00 per 1000 images)

### 5. **Storage** (3 options)
- ✅ **Local Storage** - Internal, no API needed (default)
- ❌ AWS S3 - Requires AWS account ($0.023/GB/month)
- ❌ Cloudflare R2 - Requires account ($0.015/GB/month)

### 6. **SMS** (4 options)
- ✅ **Disabled** - No API needed (default)
- ❌ Twilio - Requires API key ($0.0075-0.02 per SMS)
- ❌ Vonage (Nexmo) - Requires API key ($0.005-0.02 per SMS)
- ❌ AWS SNS - Requires AWS account ($0.00645 per SMS)

### 7. **Email** (4 options)
- ✅ **Disabled** - No API needed (default)
- ❌ SendGrid - Requires API key (100 emails/day free, then $15/month)
- ❌ Mailgun - Requires API key (5000 emails/month free, then $35/month)
- ❌ AWS SES - Requires AWS account ($0.10 per 1000 emails)

### 8. **Analytics** (4 options)
- ✅ **Disabled** - No API needed (default)
- ❌ Google Analytics - Free (requires API key)
- ❌ Mixpanel - Requires API key ($25-779/month)
- ❌ Amplitude - Requires API key ($0-995/month)

---

## 🔴 **Services ALWAYS Requiring 3rd Party**

### 9. **LiveKit Streaming** (1 option)
- ❌ **LiveKit** - Always requires LiveKit account
  - Cloud: $0.10 per participant-minute
  - Self-hosted: Free (requires server)

---

## 📊 **Breakdown by Configuration**

### **Minimum Configuration (Internal Only)**
- **Total 3rd Party APIs Required:** 1
  - LiveKit (required for streaming)

### **Typical Production Configuration**
- **Total 3rd Party APIs Required:** 3-5
  - LiveKit (required)
  - Email provider (SendGrid/Mailgun/AWS SES)
  - Storage (AWS S3/Cloudflare R2) - if scaling
  - Analytics (Google Analytics/Mixpanel) - optional
  - SMS provider (Twilio/Vonage) - optional

### **Maximum Premium Configuration**
- **Total 3rd Party APIs Required:** 9
  - LiveKit
  - Google Maps or Mapbox
  - OpenAI or Anthropic
  - Stripe Identity, Onfido, or Jumio
  - AWS Rekognition, Google Vision, or OpenAI Vision
  - AWS S3 or Cloudflare R2
  - Twilio, Vonage, or AWS SNS
  - SendGrid, Mailgun, or AWS SES
  - Google Analytics, Mixpanel, or Amplitude

---

## 💰 **Cost Estimation**

### **Free Tier (Internal Services Only)**
- LiveKit: $0 (self-hosted) or ~$50-200/month (cloud)
- **Total:** $0-200/month

### **Basic Production Setup**
- LiveKit: $50-200/month
- SendGrid: $15/month (after free tier)
- AWS S3: $5-20/month (small usage)
- **Total:** ~$70-235/month

### **Premium Setup**
- All services enabled: $200-2000/month depending on usage

---

## 🎯 **Recommendations**

### **For MVP/Development:**
- Use internal options: **0 external APIs** (except LiveKit if needed)
- Cost: $0-50/month

### **For Production:**
- LiveKit (required)
- Email provider (SendGrid free tier)
- Storage (Local or AWS S3)
- **Total: 2-3 external APIs**

### **For Scale:**
- Add analytics, SMS, premium maps/AI as needed
- **Total: 5-9 external APIs**

---

## 📝 **Notes**

- **Spark AI** and **Spark Moderation** are internal implementations that don't require external API keys
- **OpenStreetMap** is completely free and doesn't require API keys
- **Manual KYC** review doesn't require any external service
- **Local Storage** works for development and small deployments
- Most services can be **disabled** if not needed
- Only **LiveKit** is mandatory if you want streaming features

