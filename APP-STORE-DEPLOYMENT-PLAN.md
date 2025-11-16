# App Store Deployment Plan - Tranquiloo App
## HIPAA-Compliant Beta Testing Strategy

---

## ⚠️ CRITICAL: HIPAA Compliance for Beta Testing

### The Problem
- App handles Protected Health Information (PHI)
- Cannot launch to public without HIPAA compliance
- Budget constraint: Cannot upgrade to full HIPAA infrastructure until January

### The Solution: Beta Testing Mode with Disclaimers
- Launch as "Beta Testing - Research Prototype Only"
- **REQUIRE** users to acknowledge: "Do not enter real patient data"
- Use only test/demo accounts during beta
- Add prominent disclaimers throughout the app

---

## Phase 1: Pre-Launch Preparation (Week 1)

### 1.1 Add Beta Testing Disclaimers to Mobile App ✓ IN PROGRESS

**Add to LoginScreen.tsx:**
```tsx
<View style={styles.betaWarning}>
  <Text style={styles.betaTitle}>⚠️ BETA TESTING MODE</Text>
  <Text style={styles.betaText}>
    This is a research prototype for testing purposes only.
    DO NOT enter real patient information or personal health data.
    Use test accounts only (example@test.com).
  </Text>
  <Text style={styles.betaAcknowledge}>
    By continuing, you acknowledge this is for testing only.
  </Text>
</View>
```

**Add to all PHI collection screens:**
- Chat screen
- Wellness tracking screen
- Anxiety assessment screen

### 1.2 Update App Store Listings

#### App Store (iOS) Metadata:
- **App Name**: Tranquiloo - Mental Health (Beta)
- **Subtitle**: Research Prototype - Testing Only
- **Description**:
  ```
  ⚠️ BETA TESTING VERSION - DO NOT USE WITH REAL PATIENT DATA

  Tranquiloo is a mental health support application currently in beta testing.
  This version is for research and testing purposes only.

  IMPORTANT: Do not enter real patient information or personal health data.
  Use test accounts only during this beta testing period.

  Features being tested:
  - AI-powered mental health chat companions
  - Anxiety and mood tracking
  - Therapist-patient connection tools
  - Wellness monitoring

  Full HIPAA-compliant version launching January 2026.
  ```

#### Google Play Store (Android) Metadata:
- **App Name**: Tranquiloo - Mental Health (Beta)
- **Short Description**: Mental health support app - Beta testing only
- **Full Description**: Same as iOS above

### 1.3 Create Privacy Policy & Terms of Service

**Required for both app stores:**

Create `privacy-policy.md` with:
- Beta testing disclaimer
- Data collection transparency
- HIPAA compliance timeline
- User responsibilities (no real PHI)

Create `terms-of-service.md` with:
- Beta testing agreement
- Limitation of liability
- Research purposes only clause

### 1.4 Prepare Screenshots & App Preview

**Required screenshots (both platforms):**
- Login screen (with beta warning visible)
- Dashboard
- Chat screen (with disclaimer visible)
- Wellness tracking
- Settings

**Size requirements:**
- iOS: 6.5" display (1284 x 2778 pixels)
- Android: Multiple sizes for different devices

---

## Phase 2: iOS App Store Submission (Week 1-2)

### 2.1 Prerequisites
- [ ] Apple Developer Account ($99/year)
- [ ] Xcode installed on Mac
- [ ] Valid signing certificate
- [ ] App icons (1024x1024 for App Store, various sizes for app)

### 2.2 Build Configuration

**Update mobile/ios/TranquilSupport/Info.plist:**
```xml
<key>CFBundleDisplayName</key>
<string>Tranquiloo Beta</string>
<key>CFBundleVersion</key>
<string>1.0.0</string>
<key>NSHealthShareUsageDescription</key>
<string>Beta testing only - do not enter real health data</string>
```

### 2.3 Build for TestFlight

```bash
cd mobile

# Install dependencies
npm install

# iOS specific
cd ios
pod install
cd ..

# Build for iOS
npx react-native run-ios --configuration Release

# Archive for App Store
# Open in Xcode → Product → Archive → Upload to App Store
```

### 2.4 TestFlight Beta Testing

**Benefits:**
- Up to 10,000 external testers
- Automatic updates
- Crash reports
- Usage analytics

**Setup:**
1. Upload build to App Store Connect
2. Add beta testing disclaimer to TestFlight description
3. Create external testing group
4. Invite testers via email
5. Collect feedback via TestFlight

**Timeline:**
- Apple review: 24-48 hours
- Beta testing period: 4-8 weeks recommended

---

## Phase 3: Google Play Store Submission (Week 1-2)

### 3.1 Prerequisites
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Signing key generated
- [ ] App icons prepared
- [ ] Feature graphic (1024 x 500 pixels)

### 3.2 Build Configuration

**Update mobile/android/app/build.gradle:**
```gradle
android {
    defaultConfig {
        applicationId "com.tranquiloo.beta"
        versionCode 1
        versionName "1.0.0-beta"
    }
}
```

### 3.3 Build for Play Store

```bash
cd mobile/android

# Generate release APK
./gradlew assembleRelease

# Or generate AAB (recommended for Play Store)
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 3.4 Google Play Beta Track

**Benefits:**
- Internal testing: Up to 100 testers
- Closed testing: Up to unlimited testers
- Open testing: Public beta
- Staged rollout options

**Recommended: Closed Testing Track**
1. Upload AAB to Play Console
2. Create closed testing release
3. Add testers via email list or Google Group
4. Publish beta version
5. Monitor crash reports and feedback

**Timeline:**
- Google review: 1-3 days typically
- Beta testing period: 4-8 weeks

---

## Phase 4: Minimal HIPAA Compliance During Beta (Immediate)

### 4.1 Google Workspace Business Plus Setup ($18/month)

**Steps:**
1. Upgrade Google Workspace to Business Plus
2. Sign Business Associate Agreement (BAA)
3. Use HIPAA-compliant Gmail for all communications
4. Manual email verification during beta (no SendGrid)

### 4.2 Database PHI Protection

**Temporary solution until January:**
- Delete existing 14 PHI records (test accounts)
- Modify signup to REQUIRE test email addresses only
- Add validation: Reject emails from real domains
- Accept only: @test.com, @example.com, @demo.com
- Display: "Beta testing - use test@example.com format"

**Code change needed:**
```typescript
// server/routes.ts - Add to registration
if (!email.endsWith('@test.com') &&
    !email.endsWith('@example.com') &&
    !email.endsWith('@demo.com')) {
  return res.status(400).json({
    error: 'Beta testing only - please use a test email address (example@test.com)'
  });
}
```

### 4.3 App Disclaimers Implementation

**Add to every screen that collects data:**
```tsx
<Text style={styles.disclaimer}>
  🧪 Beta Test Mode - Use test data only
</Text>
```

---

## Phase 5: Beta Testing Execution (Weeks 2-10)

### 5.1 Recruitment Strategy

**Target beta testers:**
- 5-10 mental health professionals (therapists)
- 20-50 general users (simulating patients)
- Tech-savvy early adopters
- People who understand "beta testing"

**Recruitment channels:**
- Reddit: r/mentalhealth, r/therapy (with mod approval)
- Twitter/X: Tech and mental health communities
- Product Hunt: "Beta testing" tag
- BetaList.com
- Personal network

### 5.2 Onboarding Beta Testers

**Email template:**
```
Subject: Beta Test Tranquiloo Mental Health App

Hi [Name],

Thank you for joining our beta test!

⚠️ IMPORTANT: This is TESTING ONLY
- Do NOT enter real personal information
- Use test@example.com style email addresses
- All data is for research/testing purposes
- Full HIPAA-compliant version launches January 2026

Download links:
- iOS: [TestFlight link]
- Android: [Play Store Beta link]

We'd love your feedback on:
- User experience and design
- Feature usefulness
- Bugs or issues
- What you'd like to see added

Thank you!
Tranquiloo Team
```

### 5.3 Feedback Collection

**Tools:**
- TestFlight built-in feedback (iOS)
- Google Play Console reviews (Android)
- Survey: Google Forms or Typeform
- Weekly email check-ins
- Discord or Slack community (optional)

**Key metrics to track:**
- Daily active users
- Feature usage (which screens are most used?)
- Crash rate
- User retention (7-day, 30-day)
- Net Promoter Score (NPS)

---

## Phase 6: January 2026 - Full HIPAA Launch

### 6.1 Infrastructure Upgrades

**Required purchases:**
- ✅ Google Workspace Business Plus: $18/month (already active)
- 🔲 Supabase Team Plan: $599/month
- 🔲 Supabase HIPAA Add-on: $350/month
- 🔲 Resend (HIPAA email): $20/month
- **Total: $987/month**

### 6.2 Migration from Beta to Production

**Steps:**
1. Upgrade Supabase to Team + HIPAA
2. Sign Supabase BAA
3. Migrate beta app to production database
4. Remove all test data
5. Remove beta disclaimers
6. Update app store listings (remove "Beta")
7. Submit new version for full public release
8. Marketing push for general availability

### 6.3 App Store Transition

**iOS:**
- Submit v2.0.0 as production release
- Remove TestFlight warnings
- Update metadata to remove "Beta" references
- Request App Store feature (optional)

**Android:**
- Move from Beta track to Production track
- Gradual rollout: 1% → 5% → 10% → 50% → 100%
- Monitor crash rates during rollout

---

## Cost Breakdown

### Beta Testing Phase (Now - January 2026)
- Apple Developer Account: $99/year
- Google Play Console: $25 one-time
- Google Workspace Business Plus: $18/month × 3 months = $54
- **Total beta costs: $178**

### Production Phase (January 2026+)
- Monthly infrastructure: $987/month
- Annual developer accounts: $99/year
- **Total monthly: $987**

---

## Risk Mitigation

### HIPAA Compliance Risks During Beta
**Risk**: User enters real PHI despite warnings
**Mitigation**:
- Multiple prominent disclaimers
- Email validation (reject non-test emails)
- Terms of Service agreement
- Beta testing agreement
- Insurance: Consider cyber liability insurance

**Risk**: Data breach of test data
**Mitigation**:
- RLS policies already in place (42 policies active)
- Encryption at rest (Supabase default)
- Regular security audits
- Monitor Supabase Security Advisor

### App Store Rejection Risks
**Risk**: Apple/Google reject due to health claims
**Mitigation**:
- Clear "Beta testing - not medical advice" disclaimers
- Avoid medical claims in marketing
- Mark as "Research" category
- Include healthcare professional disclaimer

---

## Timeline Summary

### Week 1 (Now)
- ✓ Add beta disclaimers to mobile app
- ⏳ Upgrade Google Workspace to Business Plus
- ⏳ Sign Google BAA
- ⏳ Prepare app store assets (screenshots, descriptions)

### Week 2
- Submit iOS build to TestFlight
- Submit Android build to Play Store Beta track
- Create privacy policy and terms
- Delete existing test PHI from database

### Week 3-4
- Apple/Google review and approval
- Begin beta tester recruitment
- Set up feedback collection systems
- Monitor first testers

### Weeks 5-12 (Beta Testing)
- Onboard 30-60 beta testers
- Collect feedback
- Fix bugs and iterate
- Improve features based on usage

### January 2026
- Upgrade to full HIPAA infrastructure
- Remove beta disclaimers
- Submit production versions
- Launch to general public

---

## Next Steps (Immediate Actions)

1. **Add beta disclaimers to mobile app** (Today)
2. **Upgrade Google Workspace** (This week)
3. **Build iOS and Android releases** (This week)
4. **Create app store listings** (This week)
5. **Submit to TestFlight and Play Beta** (Next week)

---

## Questions to Answer

1. Do you have Apple Developer account? ($99/year)
2. Do you have Google Play Console account? ($25 one-time)
3. Do you have a Mac for iOS builds?
4. Are you ready to upgrade Google Workspace to Business Plus? ($18/month)
5. Do you want help adding the beta disclaimers to the mobile app now?

Let me know which step you'd like to start with!
