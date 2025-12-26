import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "es";

type Translations = Record<string, string>;

export const translationMap: Record<Language, Translations> = {
  en: {
    "brand.title": "Anxiety Companion",
    "brand.appName": "Tranquiloo",
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat",
    "nav.chatHistory": "Chat History",
    "nav.analytics": "Analytics",
    "nav.appointments": "My Appointments",
    "nav.treatment": "Track Outcomes/Treatment",
    "nav.contactTherapist": "Contact Therapist",
    "nav.settings": "Settings",
    "nav.help": "Help",
    "nav.share": "Share App",
    "nav.logout": "Log Out",
    "share.title": "Share App",
    "share.description": "Check out this amazing mental health companion app!",
    "share.copiedTitle": "Link copied!",
    "share.copiedDesc": "App link has been copied to clipboard.",
    "share.error":
      "Unable to share right now. Link copied to clipboard instead.",
    "mobile.title.analytics": "Analytics",
    "mobile.title.chatHistory": "Chat History",
    "mobile.title.chat": "Chat",
    "mobile.title.treatment": "Track Treatment",
    "mobile.title.therapist": "Find Therapist",
    "mobile.title.settings": "Settings",
    "mobile.title.help": "Help",
    "mobile.title.dashboard": "Tranquiloo",
    "lang.english": "English",
    "lang.spanish": "Español",
    "lang.switch": "Language",
    "main.LookingForPatientSupport":
      "Looking for patient support? Sign in here",
    // Trigger labels (token-style triggers)
    "trigger.generalWorry": "General worry",
    "trigger.panicAttack": "Panic attack",
    "trigger.physicalSymptoms": "Physical symptoms",
    "trigger.publicSpeaking": "Public speaking",
    "trigger.socialSituations": "Social situations",
    "trigger.crowdedRooms": "Crowded rooms",
    "trigger.groupIntroductions": "Group introductions",
    "trigger.eyeContactDuringPresentations": "Eye contact during presentations",
    "trigger.heartRacingBeforeMeetings": "Heart racing before meetings",
    "trigger.fearOfJudgment": "Fear of judgment",
    "trigger.sundayScaries": "Sunday scaries",
    "trigger.upcomingDeadlines": "Upcoming deadlines",
    "trigger.sleepDisruption": "Sleep disruption",
    "trigger.lateNightRumination": "Late-night rumination",
    "trigger.catastrophicThinking": "Catastrophic thinking",
    "trigger.sleepOnset": "Sleep onset",
    "trigger.perfectionism": "Perfectionism",
    "analytics.monthly.sampleData.june": "June 2025",
    "analytics.monthly.sampleData.july": "July 2025",
    // Auth common

    "auth.backHome": "Back to home",
    "auth.welcomeBack": "Welcome Back",
    "auth.createAccount": "Create Account",
    "auth.resetPassword": "Reset Password",
    "auth.resetSubtitle": "We'll send you instructions to reset your password",
    "auth.emailLabel": "Email Address",
    "auth.emailPlaceholder": "Enter your email",
    "auth.emailHint": "Enter the email address associated with your account",
    "auth.sendReset": "Send Reset Link",
    "auth.sending": "Sending...",
    "auth.rememberPassword": "Remember your password?",
    "auth.tagline": "Your mental health journey starts here",
    "auth.communityTagline": "Join our mental health community",
    "auth.roleQuestion": "I am registering as:",
    "auth.patientRole": "Patient",
    "auth.therapistRole": "Therapist",
    "auth.haveAccount": "Already have an account?",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.networkError": "Network error. Please try again.",
    "auth.createJourney": "Create your account to start your journey",
    "auth.resetInstructions": "Enter your email to reset your password",
    "auth.continueGoogle": "Continue with Google",
    "auth.email": "Email address",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.createAccountCta": "Don't have an account? Sign up",
    "auth.orEmail": "Or continue with email",
    "auth.therapistPortal": "Therapist Portal",
    "auth.areTherapist": "Are you a therapist? Click here",
    "auth.noAccount": "Don't have an account?",
    "auth.forgotPassword": "Forgot your password?",
    "auth.patientJourney": "Sign in to continue your journey",
    "auth.therapistJourney": "Sign in to access your professional dashboard",
    "auth.googleDisclaimer":
      "We are working toward HIPAA readiness; please avoid sharing PHI.",
    "auth.firstName": "First name",
    "auth.lastName": "Last name",
    "auth.backToSignIn": "Back to Sign In",
    "auth.checkEmail": "Check Your Email",
    "auth.resetEmailSent":
      "If an account exists with {email}, we've sent password reset instructions.",
    "auth.resetEmailBody":
      "Check your email and click the reset link to create a new password. The link expires in 1 hour.",
    "auth.invalidCredentials": "Invalid email or password",
    "auth.verifyEmailFirst":
      "Please verify your email address first. Check your inbox for the verification link.",
    // Contact therapist
    "contact.title": "Contact Therapist",
    "contact.subtitle":
      "Connect with your therapist or download your anxiety data for professional consultation",
    "contact.question": "Do you currently have a therapist?",
    "contact.questionDesc":
      "If you have a therapist, we can connect your account so they can track your progress and provide better support.",
    "contact.optionYes": "Yes, I have a therapist I'd like to connect",
    "contact.optionYesDesc":
      "Send them a secure request to review your progress.",
    "contact.optionNo": "No, I don't have a therapist",
    "contact.optionNoDesc":
      "Download your data or explore professional options.",
    "contact.connectTitle": "Connect with Your Therapist",
    "contact.connectDesc":
      "Enter your therapist’s email to send them a connection request",
    "contact.emailLabel": "Therapist Email",
    "contact.emailPlaceholder": "therapist@example.com",
    "contact.messageLabel": "Message (Optional)",
    "contact.messagePlaceholder":
      "Let your therapist know about your current concerns...",
    "contact.sendRequest": "Send Connection Request",
    "contact.connecting": "Connecting...",
    "contact.back": "Back",
    "contact.selfGuidedTitle": "You're in self-guided mode",
    "contact.selfGuidedDesc":
      "Continue using the app for anxiety management. Consider connecting with a therapist for professional support.",
    "contact.downloadTitle": "Download Your Anxiety Data",
    "contact.downloadDesc":
      "Get your complete anxiety tracking data and conversation summaries to share with a mental health professional",
    "contact.packageTitle": "Your data package includes:",
    "contact.packageItem1": "Complete anxiety tracking history and trends",
    "contact.packageItem2": "Conversation summaries with AI companion",
    "contact.packageItem3": "Trigger analysis and patterns",
    "contact.packageItem4": "Goal progress and intervention outcomes",
    "contact.packageItem5": "Clinical assessment results",
    "contact.downloadCta": "Download My Anxiety Data",
    "contact.backOptions": "Back to Options",
    "contact.readyTitle": "Ready to Find a Therapist?",
    "contact.readyDesc":
      "Professional therapy can significantly improve your anxiety management journey",
    "contact.benefitsTitle": "Benefits of Professional Therapy:",
    "contact.benefit1":
      "Personalized treatment plans based on your specific needs",
    "contact.benefit2":
      "Evidence-based therapeutic approaches (CBT, DBT, etc.)",
    "contact.benefit3": "Professional crisis support and intervention",
    "contact.benefit4": "Medication management when appropriate",
    "contact.benefit5": "Long-term recovery and coping strategies",
    "contact.findTherapist": "Find Therapists Near Me",
    "contact.downloadStarted": "Download Started",
    "contact.downloadStartedDesc":
      "Downloading your anxiety data and conversation summary...",
    "contact.downloadError": "Download Error",
    "contact.downloadErrorDesc": "Failed to download anxiety data",
    "contact.emailRequired": "Email required",
    "contact.emailRequiredDesc": "Please enter your therapist's email address",
    "contact.requestSent": "Connection Request Sent",
    "contact.requestSentDesc":
      "Your therapist will receive a notification to approve the connection",
    "contact.requestError": "Connection Error",
    "contact.requestErrorDesc":
      "Failed to connect with therapist. Please try again.",
    "contact.emergencyTitle": "Emergency Resources",
    "contact.emergency1": "National Suicide Prevention Lifeline",
    "contact.emergency1Desc": "24/7 crisis support",
    "contact.emergency2": "Crisis Text Line",
    "contact.emergency2Desc": "Text support available 24/7",
    "contact.emergency3": "SAMHSA National Helpline",
    "contact.emergency3Desc": "Treatment referral and information",
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.heroTitle": "Anxiety Guardian",
    "dashboard.heroSubtitle":
      "Your AI-powered anxiety support companion. Get personalized guidance, track your progress, and find peace of mind whenever you need it.",
    "dashboard.startChatting": "Start Chatting",
    "dashboard.takeAssessment": "Take Assessment",
    "dashboard.trackTreatment": "Track Outcomes/Treatment",
    "dashboard.analytics": "Analytics",
    "dashboard.feature.safe": "Safe & Private",
    "dashboard.feature.safeDesc":
      "Your conversations are completely private and secure",
    "dashboard.feature.support": "24/7 Support",
    "dashboard.feature.supportDesc":
      "Always available when you need someone to talk to",
    "dashboard.feature.personalized": "Personalized Care",
    "dashboard.feature.personalizedDesc":
      "Tailored support based on your unique needs",
    "dashboard.footer.rights": "All rights reserved.",
    "dashboard.footer.privacy": "Privacy Policy",
    "dashboard.footer.terms": "Terms of Service",
    "dashboard.footer.contact": "Contact Us",
    "dashboard.footer.disclaimer":
      "This app is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
    "dashboard.footer.version": "Version",
    // Settings
    "settings.title": "Settings",
    "settings.subtitle":
      "Customize your experience and manage your preferences.",
    "settings.account": "Account",
    "settings.accountDesc": "Manage your account information and settings.",
    "settings.currentEmail": "Current Email",
    "settings.notSignedIn": "Not signed in",
    "settings.patientCode": "Your Patient Code",
    "settings.copy": "Copy",
    "settings.codeCopied": "Patient code copied to clipboard",
    "settings.shareCodeHint":
      "Share this code with your therapist along with your email address so they can access your analytics and treatment data.",
    "settings.newEmail": "New Email Address",
    "settings.newEmailPlaceholder": "Enter new email address",
    "settings.updateEmail": "Update Email",
    "settings.updating": "Updating...",
    "settings.emailErrorTitle": "Error",
    "settings.emailErrorDesc": "Please enter a different email address",
    "settings.emailUpdateError": "Error updating email",
    "settings.emailUpdateErrorDesc": "Failed to update email",
    "settings.emailRequestedTitle": "Email update requested",
    "settings.emailRequestedDesc":
      "Check both your old and new email addresses for confirmation links to complete the change.",
    "settings.logout": "Log Out",
    "settings.loggingOut": "Logging out...",
    "settings.logoutSuccess": "Logged out successfully",
    "settings.logoutSuccessDesc": "You have been signed out of your account.",
    "settings.logoutError": "Error logging out",
    "settings.logoutErrorDesc": "Failed to log out",
    "settings.voiceLanguage": "Voice & Language",
    "settings.voiceLanguageDesc":
      "Configure how the AI speaks and responds to you.",
    "settings.languageLabel": "Language",
    "settings.languagePlaceholder": "Select language",
    "settings.voiceResponses": "Voice Responses",
    "settings.voiceResponsesDesc": "Enable AI to speak responses aloud",
    "settings.voiceInterruption": "Voice Interruption",
    "settings.voiceInterruptionDesc": "Allow interrupting AI by speaking",
    "settings.privacy": "Privacy & Data",
    "settings.privacyDesc": "Control how your data is stored and used.",
    "settings.localStorage": "Local Storage Only",
    "settings.localStorageDesc": "Keep all data on your device",
    "settings.analytics": "Allow Analytics",
    "settings.analyticsDesc": "Help us improve by sharing anonymized usage",
    "settings.dailyCheckIns": "Daily Check-ins",
    "settings.dailyCheckInsDesc": "Receive daily mood and anxiety prompts",
    "settings.breathingReminders": "Breathing Reminders",
    "settings.breathingRemindersDesc": "Get reminders for breathing exercises",
    "settings.notifications.title": "Notifications",
    "settings.notifications.description":
      "Manage how and when you receive notifications.",
    "settings.about.title": "About",
    "settings.about.description":
      "Information about the application and support.",
    "settings.about.version": "Version",
    "settings.about.lastUpdated": "Last Updated",
    "settings.about.today": "Today",
    "settings.about.privacyPolicy": "Privacy Policy",
    "settings.about.termsOfService": "Terms of Service",
    "settings.about.support": "Support",
    "settings.clearAllData": "Clear All Data",
    "settings.clearAllDataDesc":
      "This will permanently delete all your conversation history and settings.",
    // Therapist portal (light)
    "therapistPortal.title": "Therapist Portal",
    "therapistPortal.subtitle":
      "Enter your email to access your patients' progress data",
    "therapistPortal.emailLabel": "Email Address",
    "therapistPortal.emailPlaceholder": "dr.smith@example.com",
    "therapistPortal.access": "Access Portal",
    "therapistPortal.verifying": "Verifying...",
    "therapistPortal.demoNote": "Demo Note:",
    "therapistPortal.demoBody":
      "Enter any email address that patients have used to connect with you. This portal shows the same analytics and outcomes that patients see in their app.",
    "therapistPortal.emailRequired": "Email Required",
    "therapistPortal.emailRequiredDesc": "Please enter your email address",
    "therapistPortal.accessGranted": "Access Granted",
    "therapistPortal.welcome": "Welcome to the therapist portal",
    "therapistPortal.errorTitle": "Error",
    "therapistPortal.errorDesc": "Failed to verify therapist access",
    "therapistPortal.searchRequired": "Search Required",
    "therapistPortal.searchRequiredDesc":
      "Please enter a patient's email or 6-digit code",
    "therapistPortal.noPatients": "No Patients Found",
    "therapistPortal.noPatientsDesc":
      "No patients found with the provided search criteria",
    "therapistPortal.searchComplete": "Search Complete",
    "therapist.alreadyHaveAccount":
      "Already have a professional account? Sign in",
    "therapistPortal.searchError": "Failed to search for patients",
    // Notifications
    "notifications.title": "Notifications",
    "notifications.back": "Back to Dashboard",
    "notifications.new": "new",
    "notifications.markAll": "Mark all as read",
    "notifications.emptyTitle": "No notifications",
    "notifications.emptyDesc":
      "You're all caught up! Check back later for updates.",
    "notifications.markRead": "Mark as read",
    "notifications.type.anxiety": "Anxiety Level Alert",
    "notifications.type.treatment": "Treatment Update",
    "notifications.type.reminder": "Reminder",
    "notifications.type.achievement": "Achievement",
    "notifications.action.chat": "Talk to AI Companion",
    "notifications.action.track": "Track Your Mood",
    "notifications.action.progress": "View Progress",
    "notifications.action.chatHistory": "Open Chat History",
    "notifications.action.reschedule": "Reschedule",
    "notifications.action.view": "View details",
    "notifications.msg.anxiety":
      "Your anxiety levels have been elevated for the past 3 days. Consider practicing breathing exercises or talking to your therapist.",
    "notifications.msg.achievement":
      "Great job! You've completed 7 consecutive days of mood tracking. Keep up the good work!",
    "notifications.msg.reminder":
      "You have a therapy session scheduled for tomorrow at 2:00 PM. Don't forget to prepare your notes.",
    "notifications.msg.treatment":
      "Time for your weekly mental health check-in. How are you feeling this week?",
    // Help
    "help.title": "Help Center",
    "help.faqTitle": "Frequently Asked Questions",
    "help.faqDesc":
      "Find answers to common questions about using Anxiety Companion",
    "help.q1": "How does the AI companion work?",
    "help.a1":
      "The AI companion uses advanced natural language processing to provide personalized support for anxiety management. It can engage in conversations, offer coping strategies, and help you track your emotional well-being.",
    "help.q2": "Is my data private and secure?",
    "help.a2":
      "Yes, your privacy is our top priority. All conversations and personal data are encrypted and stored securely. You have full control over your data.",
    "help.q3": "Can I use this app without a therapist?",
    "help.a3":
      "The app can be used independently for daily anxiety management, though we recommend consulting a mental health professional for comprehensive care.",
    "help.contactTitle": "Contact Support",
    "help.contactDesc":
      "Can't find what you're looking for? Reach out to our support team.",
    "help.contactBody":
      "If you have questions that aren't answered in our FAQ, please contact our support team. We're here to help and typically respond within 24 hours.",
    "help.contactEmailLabel": "Email",
    "help.contactEmail": "support@anxietycompanion.com",
    // Support page (about/help)
    "support.title": "Support Center",
    "support.subtitle": "Get help with Tranquiloo and mental health resources",
    "support.backSettings": "Back to Settings",
    "support.contactTeam": "Contact Our Support Team",
    "support.contactBody":
      "Our dedicated support team is here to help you with any questions, technical issues, or concerns about using Tranquiloo. We strive to provide timely, helpful responses to ensure you have the best possible experience.",
    "support.emailSupport": "Email Support",
    "support.emailDesc":
      "Send us a detailed message and we'll get back to you within 24 hours.",
    "support.emailCta": "Send Email",
    "support.phoneSupport": "Phone Support",
    "support.phoneDesc":
      "Speak directly with our support team for immediate assistance.",
    "support.callNow": "Call Now",
    "support.textSupport": "Text Message Support",
    "support.textDesc":
      "Send us a text message for quick questions or non-urgent issues.",
    "support.textAvailability": "Available 24/7 for non-emergency support",
    "support.crisisTitle": "Crisis Support & Emergency Resources",
    "support.crisisLead":
      "If you're in crisis or having thoughts of self-harm:",
    "support.nationalResources": "National Resources",
    "support.onlineResources": "Online Resources",
    "support.faqTitle": "Frequently Asked Questions",
    "support.faq1.q": "How do I reset my password?",
    "support.faq1.a":
      'Go to the login page and click "Forgot Password". Enter your email address and we\'ll send you a secure link to reset your password.',
    "support.faq2.q": "Is my data secure and private?",
    "support.faq2.a":
      "We are working toward full compliance and use encryption to protect your personal health information. See our Privacy Policy for details.",
    "support.faq3.q": "Can I export my conversation history?",
    "support.faq3.a":
      "You can download your conversation summaries and analytics data from the Analytics and Treatment Resources pages.",
    "support.faq4.q": "How accurate is the AI anxiety analysis?",
    "support.faq4.a":
      "Our AI follows clinical anxiety assessment frameworks, but it complements—not replaces—professional care. Consult healthcare providers for clinical decisions.",
    "support.faq5.q": "Can I use Tranquiloo with my therapist?",
    "support.faq5.a":
      "Yes. You can share analytics and progress reports with your therapist using the “Share with Therapist” feature.",
    "support.faq6.q": "How can my therapist access my progress data?",
    "support.supportHoursAndResponseTimes": "Support Hours & Response Times",
    "support.businessHours": "Business Hours",
    "support.mondayToFriday": "Monday - Friday:",
    "support.saturday": "Saturday:",
    "support.sunday": "Sunday:",
    "support.emergencyResources":
      "*Emergency resources are available 24/7 through the crisis hotlines listed above",
    // Crisis resources modal
    "crisisModal.title": "Crisis Support Resources",
    "crisisModal.subtitle": "Available 24/7 when you need immediate support",
    "crisisModal.hotlinesTitle": "24/7 Crisis Hotlines",
    "crisisModal.strategiesTitle": "Right Now: Things You Can Do",
    "crisisModal.rememberLabel": "Remember:",
    "crisisModal.rememberText":
      "If you're in immediate danger, call 911 or go to your nearest emergency room. These intense feelings will pass - you've survived difficult moments before, and you can get through this one too. You matter, and there are people who want to help you.",
    "crisisModal.close": "Close",
    "crisisModal.resources.988.name": "988 Suicide & Crisis Lifeline",
    "crisisModal.resources.988.description": "24/7 crisis support and suicide prevention",
    "crisisModal.resources.textLine.name": "Crisis Text Line",
    "crisisModal.resources.textLine.phone": "Text HOME to 741741",
    "crisisModal.resources.textLine.description": "24/7 crisis support via text messaging",
    "crisisModal.resources.dvHotline.name": "National Domestic Violence Hotline",
    "crisisModal.resources.dvHotline.description": "24/7 support for domestic violence situations",
    "crisisModal.resources.samhsa.name": "SAMHSA National Helpline",
    "crisisModal.resources.samhsa.description": "24/7 treatment referral and information service",
    "crisisModal.strategies.grounding54321.title": "5-4-3-2-1 Grounding",
    "crisisModal.strategies.grounding54321.description":
      "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste",
    "crisisModal.strategies.breathing446.title": "4-4-6 Breathing",
    "crisisModal.strategies.breathing446.description":
      "Breathe in for 4 counts, hold for 4, breathe out for 6. Repeat 10 times.",
    "crisisModal.strategies.coldWater.title": "Cold Water Reset",
    "crisisModal.strategies.coldWater.description":
      "Splash cold water on your face or hold ice cubes to reset your nervous system",
    "crisisModal.strategies.movement.title": "Physical Movement",
    "crisisModal.strategies.movement.description":
      "Do jumping jacks, push-ups, or go for a walk to release tension",
    "crisisModal.strategies.safePerson.title": "Safe Person",
    "crisisModal.strategies.safePerson.description":
      "Call or text one person who makes you feel safe and supported",
    "support.responseTimes": "Response Times",
    "support.phone": "Phone:",
    "support.immediateDuringBusinessHours": "Immediate during business hours",
    "support.email": "Email:",
    "support.within24Hours": "Within 24 hours",
    "support.text": "Text:",
    "support.within4Hours": "Within 4 hours",
    "support.criticalIssues": "Critical Issues:",
    "support.within2Hours": "Within 2 hours",
    "support.faq6.a":
      "After connecting your therapist in the app, they can access their dedicated portal to view real-time analytics and weekly reports.",
    "support.feedbackAndSuggestions": "Feedback & Suggestions",
    "support.feedbackAndSuggestionsDescription":
      "We're constantly working to improve Tranquiloo based on user feedback. If you have suggestions for new features, improvements, or general feedback about your experience, we'd love to hear from you.",
    "support.shareYourIdeas": "Share Your Ideas",
    "support.sendYourFeedback": "Send your feedback to:",
    "support.reviewAllFeedback":
      "We review all feedback and prioritize features based on user needs and clinical value.",
    // Therapist dashboard / patient directory
    "therapistDashboard.patientDirectory": "Patient Directory",
    "therapistDashboard.patientDirectoryDesc":
      "All your accepted patients ({count} total)",
    "therapistDashboard.searchPlaceholder":
      "Search by name, email, or patient code...",
    "therapistDashboard.loadingPatients": "Loading patient directory...",
    "therapistDashboard.noPatients": "No patients yet",
    "therapistDashboard.noPatientsSearch":
      "No patients found matching your search",
    "therapistDashboard.active": "Active",
    "therapistDashboard.sharingReports": "Sharing Reports",
    "therapistDashboard.email": "Email",
    "therapistDashboard.patientCode": "Patient Code",
    "therapistDashboard.phone": "Phone",
    "therapistDashboard.gender": "Gender",
    "therapistDashboard.age": "Age",
    "therapistDashboard.connected": "Connected",
    "therapistDashboard.years": "years",
    "therapistDashboard.downloads.title": "Download Activity Trends",
    "therapistDashboard.downloads.noneTitle": "No Download History Yet",
    "therapistDashboard.downloads.noneDesc":
      "Your download activity will appear here once you start exporting reports, charts, and analytics data. Each download will be tracked with detailed insights.",
    "therapistDashboard.downloads.total": "Total Downloads",
    "therapistDashboard.downloads.totalData": "Total Data",
    "therapistDashboard.downloads.thisWeek": "This Week",
    "therapistDashboard.downloads.avgSize": "Avg Size",
    "therapistDashboard.downloads.activity": "Download Activity",
    "therapistDashboard.downloads.category": "Download Category Mix",
    "therapistDashboard.downloads.types.analytics": "Analytics",
    "therapistDashboard.downloads.types.reports": "Reports",
    "therapistDashboard.downloads.types.summaries": "Summaries",
    "therapistDashboard.downloads.types.exports": "Exports",
    "therapistDashboard.range.allTime": "All time",
    "therapistDashboard.range.select": "Select range",
    "therapistDashboard.range.label": "Date range",
    "therapistDashboard.range.apply": "Apply",
    "therapistDashboard.range.clear": "Clear",
    // Analytics header
    "analytics.header.title": "Analytics Dashboard",
    "analytics.header.data":
      "Showing data from {count} anxiety analysis sessions",
    "analytics.header.empty": "No data yet - start chatting to see analytics",
    "analytics.header.downloadHistory": "Download History",
    "analytics.header.downloadSummary": "Download Conversation Summary",
    "analytics.header.shareTherapist": "Share with Therapist",
    "analytics.header.viewTreatment": "View Treatment",
    "analytics.header.realtime": "Real-time data",
    // Analytics metrics
    "analytics.metrics.totalSessions": "Total Sessions",
    "analytics.metrics.averageAnxiety": "Average Anxiety",
    "analytics.metrics.mostCommonTrigger": "Most Common Trigger",
    "analytics.metrics.noTriggers": "No triggers recorded",
    "analytics.metrics.treatmentProgress": "Treatment Progress",
    "analytics.metrics.progressImproving": "Improving",
    "chatHistorySidebar.noChatsFound": "No chats found",
    "chatHistorySidebar.noConversationsYet": "No conversations yet",
    "chatHistorySidebar.tryDifferentSearch": "Try a different search",
    "chatHistorySidebar.startChatting":
      "Start chatting to see your history here",
    "chatHistorySidebar.noChatsFoundDesc":
      "Start a new chat to see your conversation history",
    "chatHistorySidebar.yesterday": "Yesterday",
    "chatHistorySidebar.thisWeek": "This Week",
    "chatHistorySidebar.older": "Older",
    // Analytics empty
    "analytics.empty.title": "No Analytics Data Yet",
    "analytics.empty.desc":
      "Start chatting with your AI companion to generate anxiety analytics data.",
    "analytics.empty.start": "Start Chatting",
    "analytics.outcomes.anxietyLevel": "Anxiety Level",
    // Analytics charts
    "analytics.trends.title": "Weekly Anxiety Type Trends",
    "analytics.trends.none": "No trend data available yet",
    "analytics.trends.work": "Work/Career",
    "analytics.trends.social": "Social",
    "analytics.trends.health": "Health",
    "analytics.trends.financial": "Financial",
    "analytics.trends.relationships": "Relationships",
    "analytics.trends.future": "Future/Uncertainty",
    "analytics.trends.family": "Family",
    "analytics.distribution.title": "Anxiety Levels Distribution",
    "analytics.distribution.range.low": "1-3 (Low)",
    "analytics.distribution.range.moderate": "4-6 (Moderate)",
    "analytics.distribution.range.high": "7-8 (High)",
    "analytics.distribution.range.severe": "9-10 (Severe)",
    "analytics.distribution.tooltip.sessions": "Sessions",
    "analytics.distribution.tooltip.percentage": "Percentage",
    // Treatment outcomes
    "analytics.outcomes.change": "Change",
    "analytics.outcomes.status": "Status",
    "analytics.outcomes.treatmentEffectiveness.improving": "Improving",
    "analytics.outcomes.treatmentEffectiveness.stable": "Stable",
    "analytics.outcomes.treatmentEffectiveness.declining": "Declining",
    "analytics.triggers.title": "Trigger Analysis",
    "analytics.triggers.total": "Total entries: {count}",
    "analytics.triggers.trigger": "Trigger",
    "analytics.triggers.count": "Count",
    "analytics.triggers.avgSeverity": "Avg severity",
    "analytics.triggers.trend": "Trend",
    "analytics.triggers.related": "Related triggers",
    "analytics.triggers.why": "Why it happens",
    "analytics.triggers.description": "Description",
    "analytics.triggers.evidence": "Clinical Evidence",
    "analytics.triggers.trendLabel": "Trend",
    "analytics.triggers.recalledContext": "Recalled Context",
    "analytics.triggers.aggravators": "Aggravating Factors",
    "analytics.triggers.impact": "Impact/Avoidance",
    "analytics.triggers.lastOccurrence": "Last Occurrence",
    "analytics.triggers.relatedPatterns": "Related Trigger Patterns",
    "analytics.triggers.patternNotedGeneral":
      "Pattern noted for general anxiety; limited details recorded. Encourage logging when/where/body cues to refine the plan.",
    "analytics.triggers.healthConcernsNarrative":
      "Patient reports anxiety with health concerns, recalling physical symptoms. Symptoms intensify with body sensations and medical news, leading to health monitoring.",
    // Trigger categories
    "analytics.triggers.category.socialAnxiety": "Social Anxiety",
    "analytics.triggers.category.generalAnxiety": "General Anxiety",
    "analytics.triggers.category.healthConcerns": "Health Concerns",
    // Patient narrative translations
    "analytics.triggers.patientReports.social": "Patient reports anxiety with social situations, recalling",
    "analytics.triggers.patientReports.work": "Patient reports anxiety with work/academic situations, recalling",
    "analytics.triggers.patientReports.financial": "Patient reports anxiety with financial matters, recalling",
    "analytics.triggers.patientReports.relationships": "Patient reports anxiety with relationships, recalling",
    "analytics.triggers.patientReports.uncertainty": "Patient reports anxiety with uncertainty, recalling",
    "analytics.triggers.symptomsIntensify": "Symptoms intensify with",
    "analytics.triggers.leadingTo": "leading to",
    // Memory contexts
    "analytics.triggers.memoryContext.encountersAttractive": "encounters with attractive individuals",
    "analytics.triggers.memoryContext.pastCriticism": "past experiences of criticism",
    "analytics.triggers.memoryContext.difficultConversations": "difficult past conversations",
    "analytics.triggers.memoryContext.performanceReviews": "past performance reviews",
    "analytics.triggers.memoryContext.previousSetbacks": "previous setbacks",
    "analytics.triggers.memoryContext.visaConcerns": "visa concerns",
    "analytics.triggers.memoryContext.physicalSymptoms": "physical symptoms",
    "analytics.triggers.memoryContext.healthScares": "past health scares",
    "analytics.triggers.memoryContext.financialStruggles": "past financial struggles",
    "analytics.triggers.memoryContext.jobLoss": "job loss",
    "analytics.triggers.memoryContext.familyConflicts": "family conflicts",
    "analytics.triggers.memoryContext.relationshipChallenges": "relationship challenges",
    "analytics.triggers.memoryContext.uncertainOutcomes": "uncertain outcomes",
    "analytics.triggers.memoryContext.socialSituations": "social situations",
    "analytics.triggers.memoryContext.workplaceChallenges": "workplace challenges",
    "analytics.triggers.memoryContext.variousSituations": "various situations",
    // Aggravators
    "analytics.triggers.aggravator.eyeContact": "eye contact",
    "analytics.triggers.aggravator.unexpectedEncounters": "unexpected encounters",
    "analytics.triggers.aggravator.beingObserved": "being observed",
    "analytics.triggers.aggravator.performanceSituations": "performance situations",
    "analytics.triggers.aggravator.groupSettings": "group settings",
    "analytics.triggers.aggravator.unfamiliarPeople": "unfamiliar people",
    "analytics.triggers.aggravator.crowdedSpaces": "crowded spaces",
    "analytics.triggers.aggravator.unexpectedAttention": "unexpected attention",
    "analytics.triggers.aggravator.deadlines": "deadlines",
    "analytics.triggers.aggravator.evaluations": "evaluations",
    "analytics.triggers.aggravator.highStakesTasks": "high-stakes tasks",
    "analytics.triggers.aggravator.competition": "competition",
    "analytics.triggers.aggravator.timePressure": "time pressure",
    "analytics.triggers.aggravator.performanceExpectations": "performance expectations",
    "analytics.triggers.aggravator.bodySensations": "body sensations",
    "analytics.triggers.aggravator.medicalNews": "medical news",
    "analytics.triggers.aggravator.billsArriving": "bills arriving",
    "analytics.triggers.aggravator.budgetDiscussions": "budget discussions",
    "analytics.triggers.aggravator.arguments": "arguments",
    "analytics.triggers.aggravator.emotionalDistance": "emotional distance",
    "analytics.triggers.aggravator.lackOfControl": "lack of control",
    "analytics.triggers.aggravator.unpredictableChanges": "unpredictable changes",
    "analytics.triggers.aggravator.stress": "stress",
    "analytics.triggers.aggravator.unexpectedEvents": "unexpected events",
    // Impacts
    "analytics.triggers.impact.avoidanceSocialVenues": "avoidance of social venues",
    "analytics.triggers.impact.socialWithdrawal": "social withdrawal",
    "analytics.triggers.impact.limitingInteractions": "limiting social interactions",
    "analytics.triggers.impact.socialAvoidance": "social avoidance",
    "analytics.triggers.impact.procrastination": "procrastination",
    "analytics.triggers.impact.selfDoubt": "self-doubt",
    "analytics.triggers.impact.workAvoidance": "work avoidance",
    "analytics.triggers.impact.careerLimitations": "career limitations",
    "analytics.triggers.impact.healthMonitoring": "health monitoring",
    "analytics.triggers.impact.spendingRestrictions": "spending restrictions",
    "analytics.triggers.impact.relationshipStrain": "relationship strain",
    "analytics.triggers.impact.decisionParalysis": "decision paralysis",
    "analytics.triggers.impact.dailyFunctioning": "daily functioning",
    // Fallback pattern
    "analytics.triggers.fallbackPattern": "Pattern noted for {trigger}; limited details recorded. Encourage logging when/where/body cues to refine the plan.",
    // Related trigger names
    "analytics.triggers.relatedTrigger.crowdedRooms": "crowded rooms",
    "analytics.triggers.relatedTrigger.groupIntroductions": "group introductions",
    "analytics.triggers.relatedTrigger.eyeContactPresentations": "eye contact during presentations",
    "analytics.triggers.relatedTrigger.heartRacingMeetings": "heart racing before meetings",
    "analytics.triggers.relatedTrigger.perfectionism": "perfectionism",
    "analytics.triggers.relatedTrigger.sundayScaries": "sunday scaries",
    "analytics.triggers.relatedTrigger.fearOfJudgment": "fear of judgment",
    "analytics.triggers.relatedTrigger.socialAnxiety": "social anxiety",
    "analytics.triggers.relatedTrigger.workStress": "work stress",
    "analytics.triggers.relatedTrigger.healthConcerns": "health concerns",
    "analytics.triggers.relatedTrigger.financialStress": "financial stress",
    "analytics.triggers.relatedTrigger.relationshipIssues": "relationship issues",
    // More triggers message
    "analytics.triggers.moreTriggers": "more triggers requiring analysis",
    // Evidence line translations
    "analytics.triggers.evidenceLabel": "Evidence: Last episode",
    "analytics.triggers.severityScale": "/10",
    "analytics.triggers.episodesIn": "episodes in",
    "analytics.triggers.vsPrior": "vs prior",
    // Time windows
    "analytics.triggers.timeWindow.pastMonth": "past month",
    "analytics.triggers.timeWindow.pastTwoWeeks": "past two weeks",
    "analytics.triggers.timeWindow.pastWeek": "past week",
    "analytics.triggers.timeWindow.pastYear": "past year",
    // Trends
    "analytics.triggers.trend.increasing": "increasing",
    "analytics.triggers.trend.decreasing": "decreasing",
    "analytics.triggers.trend.stable": "stable",
    // Date terms
    "analytics.triggers.date.today": "today",
    "analytics.triggers.date.yesterday": "yesterday",
    "analytics.triggers.date.recently": "recently",
    "analytics.triggers.date.oneDayAgo": "1 day ago",
    "analytics.triggers.date.daysAgo": "{count} days ago",
    "analytics.triggers.date.oneWeekAgo": "1 week ago",
    "analytics.triggers.date.weeksAgo": "{count} weeks ago",
    // Anxiety tracker
    "analytics.tracker.title": "Your Anxiety Analytics & Tracking",
    "analytics.tracker.emptyTitle": "Anxiety Analytics & Tracking",
    "analytics.tracker.improving": "IMPROVING",
    "analytics.tracker.worsening": "WORSENING",
    "analytics.tracker.stable": "STABLE",
    "analytics.tracker.emptyDesc":
      "Start chatting to see your anxiety analytics and intervention tracking.",
    "analytics.tracker.startChat": "Start Chat Session",
    "analytics.tracker.avgAnxiety": "Avg Anxiety",
    "analytics.tracker.avgGad7": "Avg GAD-7",
    "analytics.tracker.sessions": "Sessions",
    "analytics.tracker.trend": "Trend",
    "analytics.tracker.mostEffective": "Most Effective Interventions for You:",
    "analytics.tracker.effectiveness": "effectiveness",
    "analytics.tracker.used": "Used {count}x",
    "analytics.tracker.recentProgress": "Your Recent Progress:",
    "analytics.tracker.progressImproving":
      "🎉 Great progress! Your anxiety levels have been decreasing. Keep using the interventions that work best for you.",
    "analytics.tracker.progressStable":
      "📊 Your anxiety levels are stable. Consider trying new interventions or increasing the frequency of current ones.",
    "analytics.tracker.progressWorsening":
      "🤗 Your anxiety levels have increased recently. This is normal - consider reaching out for additional support or trying crisis interventions.",
    // Treatment outcomes
    "analytics.outcomes.title": "Treatment Outcomes",
    "analytics.outcomes.emptyDesc":
      "Start tracking your anxiety to see treatment outcomes and trends.",
    // Monthly charts
    "analytics.monthly.title": "Monthly Anxiety Trends by Category",
    "analytics.monthly.none": "Add more sessions to see monthly trends.",
    // Chat history
    "chatHistory.title": "Chat History",
    "chatHistory.subtitle":
      "Review your previous conversations and anxiety interventions",
    "chatHistory.recentConversations": "Recent Conversations",
    "chatHistory.sessionsDesc": "Your chat sessions with AI companions",
    "chatHistory.analyticsTitle": "Anxiety Analyses",
    "chatHistory.analyticsDesc": "AI-generated analyses from your chats",
    "chatHistory.low": "Low",
    "chatHistory.moderate": "Moderate",
    "chatHistory.high": "High",
    "chatHistory.noSessions": "No chat sessions yet",
    "chatHistory.noSessionsDesc":
      "Start a conversation to see your history here",
    "chatHistory.untitled": "Untitled Chat",
    "chatHistory.viewConversation": "View Conversation",
    "chatHistory.anxietyLevel": "Anxiety Level",
    "chatHistory.interventions": "Anxiety Interventions",
    "chatHistory.interventionsDesc":
      "AI-powered anxiety analysis and coping strategies",
    "chatHistory.identifiedTriggers": "Identified Triggers",
    "chatHistory.copingStrategies": "Coping Strategies",
    "chatHistory.aiResponse": "AI Response",
    "chatHistory.noAnalyses": "No anxiety analyses yet",
    "chatHistory.noAnalysesDesc":
      "Chat with our AI companions to receive personalized support",
    // Chat header
    "chat.header.vanessaTitle": "Advanced Anxiety Support with Vanessa",
    "chat.header.monicaTitle": "Advanced Anxiety Support with Monica",
    "chat.header.vanessaSubtitle":
      "AI companion with clinical analysis and voice support",
    "chat.header.monicaSubtitle":
      "AI companion with clinical analysis and voice support",
    "chat.header.warning":
      "Voice features not available in this browser. You can still chat by typing.",
    "chat.header.mobileHistory": "History",
    "chat.header.badge.es": "Español",
    "chat.welcome.vanessa":
      "Hello! I'm Vanessa, your advanced AI anxiety companion. I'm here to provide you with clinically-informed support using the latest therapeutic approaches. How are you feeling today?",
    "chat.error.tryAgain":
      "I'm having trouble responding right now. Please try again in a moment",

    // Appointments
    "appointments.back": "Back",
    "appointments.title": "My Appointments",
    "appointments.subtitle": "Schedule and manage therapy sessions",
    // Goals
    "analytics.goals.title": "Goal Progress Overview",
    "analytics.goals.emptyTitle": "No Goals Set Yet",
    "analytics.goals.emptyDesc":
      "Start by creating goals to track your progress and see analytics.",
    "analytics.goals.total": "Goals",
    "analytics.goals.completed": "Completed",
    "analytics.goals.inProgress": "In progress",
    "analytics.goals.avgScore": "Avg score",
    "analytics.goals.adherence": "Adherence",
    "analytics.goals.history": "Progress history",
    "analytics.goals.category": "Category",
    "analytics.goals.badge.completed": "Completed",
    "analytics.goals.badge.good": "Good progress",
    "analytics.goals.badge.started": "Getting started",
    "analytics.goals.badge.new": "New goal",
    "analytics.goals.progressLabel": "Progress",
    "analytics.goals.scoreLabel": "Score",
    // Mock goals translations
    "goals.goal1.title": "Practice deep breathing daily",
    "goals.goal1.description":
      "Do 10 minutes of deep breathing exercises every morning",
    "goals.goal1.notes.progress1": "Felt good today",
    "goals.goal1.notes.progress2": "Very relaxing",
    "goals.goal2.title": "Exercise 3 times per week",
    "goals.goal2.description": "Go for a 30-minute walk or jog",
    "goals.goal2.notes.progress3": "Good walk in the park",
    "goals.seed.dailyGrounding.title": "Daily grounding practice",
    "goals.seed.dailyGrounding.description": "5-10 minutes of breathing/body scan after lunch",
    "goals.seed.exposure.title": "Exposure reps",
    "goals.seed.exposure.description": "Intentional exposures with reduced safety behaviors",
    // Goal frequency translations
    "goals.frequency.daily": "daily",
    "goals.frequency.weekly": "weekly",
    "goals.frequency.monthly": "monthly",
    "goals.frequency.3x/week": "3x/week",
    // Goal unit translations
    "goals.unit.minutes": "minutes",
    "goals.unit.times": "times",
    "goals.unit.sessions/week": "sessions/week",
    "goals.unit.exposures/week": "exposures/week",
    // Goal tracker UI translations
    "goals.tracker.loading": "Loading goals...",
    "goals.tracker.emptyTitle": "No Goals Set",
    "goals.tracker.emptyDesc":
      "Create your first goal to start tracking your progress toward better mental health.",
    "goals.tracker.emptyCta": "Create Your First Goal",
    "goals.tracker.title": "Your Goals",
    "goals.tracker.description":
      "Track your progress toward better mental health",
    "goals.tracker.addGoal": "Add Goal",
    "goals.tracker.latestProgress": "Latest Progress",
    "goals.tracker.recordProgress": "Record Progress",
    "goals.tracker.averageScore": "Average Score",
    "goals.tracker.completionRate": "Completion Rate",
    // Goal progress form
    "goals.progressForm.title": "Record Progress",
    "goals.progressForm.instruction":
      "How well did you achieve this goal today? Rate from 1 (very difficult) to 10 (excellent).",
    "goals.progressForm.scoreLabel": "Progress Score",
    "goals.progressForm.score.excellent": "Excellent progress!",
    "goals.progressForm.score.good": "Good progress",
    "goals.progressForm.score.making": "Making progress",
    "goals.progressForm.score.challenges": "Some challenges",
    "goals.progressForm.score.difficult": "Difficult day",
    "goals.progressForm.slider.veryDifficult": "Very Difficult (1)",
    "goals.progressForm.slider.excellent": "Excellent (10)",
    "goals.progressForm.notesLabel": "Notes (Optional)",
    "goals.progressForm.notesPlaceholder":
      "Add any notes about your progress, challenges, or thoughts...",
    "goals.progressForm.submitButton": "Record Progress",
    "goals.progressForm.cancelButton": "Cancel",
    // Goal categories translations
    "goals.category.mindfulness": "Mindfulness",
    "goals.category.exercise": "Exercise",
    "goals.category.treatment": "Treatment",
    "goals.category.self-care": "Self Care",
    "goals.category.therapy": "Therapy",
    "goals.category.social": "Social",
    "goals.category.work": "Work",
    "goals.category.sleep": "Sleep",
    "goals.category.nutrition": "Nutrition",
    // Treatment outcomes charts
    "analytics.outcomes.trendTitle": "Average Anxiety Level Trends",
    "analytics.outcomes.trendEmptyTitle": "No trend data available yet",
    "analytics.outcomes.trendEmptyDesc":
      "Start tracking your anxiety levels to see progress trends",
    "analytics.outcomes.weeklyTitle": "Weekly Treatment Outcomes",
    "analytics.outcomes.avgAnxiety": "Avg Anxiety",
    "analytics.outcomes.trendLabel": "Trend",
    "analytics.outcomes.treatmentEffectiveness": "Treatment effectiveness",
    // Appointments
    "appointments.header": "Schedule Appointment",
    "appointments.subheader":
      "Book a video or audio session with your therapist",
    "appointments.therapist": "Therapist *",
    "appointments.selectTherapist": "Select a therapist",
    "appointments.noConnectionsTitle": "No Connected Therapists",
    "appointments.noConnectionsDesc":
      "You need to connect with a therapist before scheduling appointments.",
    "appointments.connectCta": "Click here to connect with a therapist",
    "appointments.connectHow":
      'How it works: Go to "Contact Therapist", submit your therapist\'s email, and wait for them to accept your connection request.',
    "appointments.date": "Date *",
    "appointments.time": "Time *",
    "appointments.duration": "Duration",
    "appointments.duration.30": "30 minutes",
    "appointments.duration.45": "45 minutes",
    "appointments.duration.60": "60 minutes (1 hour)",
    "appointments.duration.90": "90 minutes (1.5 hours)",
    "appointments.sessionType": "Session Type *",
    "appointments.video": "Video session",
    "appointments.audio": "Audio session",
    "appointments.inPerson": "In-person session",
    "appointments.videoDesc": "Face-to-face session",
    "appointments.audioDesc": "Voice only session",
    "appointments.inPersonDesc": "Meet at the therapy location",
    "appointments.notes": "Notes (Optional)",
    "appointments.notesPlaceholder":
      "Any specific topics or concerns you’d like to discuss...",
    "appointments.important": "Important Information",
    "appointments.info.internet":
      "Both you and your therapist need internet connection",
    "appointments.info.recording":
      "Sessions may be recorded for quality; we are working toward HIPAA readiness",
    "appointments.info.reminder":
      "You'll receive a reminder 1 hour before your appointment",
    "appointments.info.early":
      "Please join 5 minutes early to test your connection",
    "appointments.scheduleCta": "Schedule Appointment",
    "appointments.scheduling": "Scheduling...",
    "appointments.missing": "Missing Information",
    "appointments.missingDesc": "Please fill in all required fields",
    "appointments.scheduledTitle": "Appointment Scheduled",
    "appointments.scheduledDesc":
      "Your appointment has been scheduled successfully",
    "appointments.failedTitle": "Scheduling Failed",
    "appointments.failedDesc":
      "Unable to schedule appointment. Please try again.",
    "appointments.cancelConfirm":
      "Are you sure you want to cancel this appointment?",
    "appointments.cancelledTitle": "Appointment Cancelled",
    "appointments.cancelledDesc": "Your appointment has been cancelled",
    "appointments.cancelFailedTitle": "Cancellation Failed",
    "appointments.cancelFailedDesc": "Unable to cancel appointment",
    "appointments.joinFailedTitle": "Join Failed",
    "appointments.joinFailedDesc": "Unable to join appointment",
    "appointments.inPersonInfo":
      "This appointment is scheduled for an in-person visit. Arrive a few minutes early and bring your recording kit if required.",
    "appointments.noUpcoming": "No upcoming appointments",
    "appointments.noUpcomingDesc": "Schedule your first appointment above",
    "appointments.upcomingTab": "Upcoming",
    "appointments.pastTab": "Past",
    "appointments.status.scheduled": "Scheduled",
    "appointments.status.confirmed": "Confirmed",
    "appointments.status.inProgress": "In Progress",
    "appointments.status.completed": "Completed",
    "appointments.status.cancelled": "Cancelled",
    "appointments.loading": "Loading appointments...",
    "appointments.noPast": "No past appointments",
    "appointments.noPastDesc":
      "Past appointments will appear here after you attend or complete them.",
    "appointments.joinWindow":
      "You can join 10 minutes before your scheduled time.",
    "appointments.openLink": "Open link",
    "appointments.copyButton": "Copy",
    "appointments.joinVia": "Join via Tranquiloo",
    "appointments.durationLabel": "Duration",
    "appointments.minutesShort": "min",
    "appointments.noLinkYet":
      "Your therapist will share the meeting link before the session, or you can join through Tranquiloo below.",
    "appointments.therapistLabel": "Therapist",
    "appointments.join": "Join",
    "appointments.cancel": "Cancel",
    "appointments.copyLink": "Meeting link copied to clipboard",
    "appointments.copyFailed": "Unable to copy meeting link",
    "appointments.linkCopiedTitle": "Link copied",
    "appointments.copyFailedTitle": "Copy failed",
    // Intervention summaries & treatment insights
    "interventions.title": "Intervention Summaries",
    "interventions.badge": "Updated from session data",
    "interventions.tabs.overview": "Overview",
    "interventions.tabs.session": "Session",
    "interventions.tabs.week": "Weekly",
    "interventions.tabs.month": "Monthly",
    "interventions.tabs.year": "Yearly",
    "interventions.recent": "Recent Sessions",
    "interventions.weeklyOverview": "Weekly Overview",
    "interventions.monthlyOverview": "Monthly Overview",
    "interventions.yearlyOverview": "Yearly Overview",
    "interventions.noRecent": "No recent session summaries available.",
    "interventions.noWeekly": "No weekly summaries available yet.",
    "interventions.noMonthly": "No monthly summaries available yet.",
    "interventions.noYearly": "No yearly summaries available yet.",
    "interventions.sessions": "sessions",
    "interventions.trend": "Trend",
    "interventions.snapshot": "Patient snapshot",
    "interventions.progressObserved": "Progress observed",
    "interventions.avgAnxiety": "Avg anxiety",
    "interventions.topTriggers": "Top triggers",
    "interventions.noTriggers": "No specific triggers documented.",
    "interventions.therapyApplied": "Therapy applied",
    "interventions.adherence": "adherence",
    "interventions.noTherapies": "No interventions documented this period.",
    "interventions.clinicalNotes": "Clinical notes",
    "interventions.noNotes": "No clinician notes documented this period.",
    "interventions.homework": "Next steps / homework",
    "interventions.homeworkFallback": "Continue agreed coping plan",
    "interventions.forClinicians": "For clinicians",
    "interventions.noData": "No prior period",
    "interventions.progressImproving": "Improving",
    "interventions.progressNeedsSupport": "Needs support",
    "interventions.progressStable": "Stable",
    "interventions.trend.upVsPrior": "↑ {delta} vs prior",
    "interventions.trend.downVsPrior": "↓ {delta} vs prior",
    "interventions.patientProblem.withTrigger":
      "Patient experienced heightened anxiety around {trigger}. Severity averaged {avg}/10.",
    "interventions.patientProblem.noTrigger":
      "Patient reported anxiety averaging {avg}/10 without clear trigger.",
    "interventions.progressSummary": "{direction}: Immediate response {trend}.",
    "interventions.avgAnxietyRange": "{label} {avg}/10 (range {min}–{max}).",
    "interventions.homeworkTemplate":
      "Focus task: {task}. Reinforce practice 3×/day or as assigned.",
    "interventions.adherence.partial": "Partial",
    "pattern.noteWithFocus":
      "Noted pattern: {pattern}. Prioritize short nervous-system resets, then exposure with safety behaviors reduced by 20%.",
    "pattern.socialPerformanceAnxiety": "Social + performance anxiety (presentations, group settings)",
    // Treatment insights blocks
    "treatment.insights.title": "Treatment Insights for Therapists",
    "treatment.insights.currentTrend": "Current Trend",
    "treatment.insights.interventionSuccess": "Intervention Success",
    "treatment.insights.noData":
      "Collect more data over time to see treatment effectiveness patterns.",
    "treatment.insights.weeksImproved":
      "{improved} of {total} weeks showed improvement",
    "treatment.insights.decliningResults":
      "Treatment is showing {status} results with an average anxiety level of {anxiety}/10",
    // Track outcomes/treatment page
    "treatmentResources.title": "Track Outcomes & Treatment",
    "treatmentResources.subtitle":
      "Monitor your progress, track goals, and access evidence-based treatments",
    "treatmentResources.download": "Download Conversation Summary",
    "treatmentResources.connect": "Connect with Therapist",
    "treatmentResources.noActiveTitle": "No Active Treatment",
    "treatmentResources.noActiveDesc":
      "Based on your anxiety patterns, we recommend starting with professional therapy",
    "treatmentResources.takeAssessment": "Take Assessment",
    "treatmentResources.findTherapist": "Find Therapist",
    "treatmentResources.goalsTitle": "Your Goals",
    "treatmentResources.goalsSubtitle":
      "Track your progress toward better mental health",
    // Treatment options
    "treatmentResources.recommendedOptions": "Recommended Treatment Options",
    "treatmentResources.recommended": "Recommended",
    "treatmentResources.duration": "Duration",
    "treatmentResources.effectiveness": "effectiveness",
    "treatmentResources.effectiveness.high": "high",
    "treatmentResources.effectiveness.moderate": "moderate",
    "treatmentResources.learnMore": "Learn More",
    // Treatment categories
    "treatmentResources.category.all": "All Resources",
    "treatmentResources.category.therapy": "Professional Therapy",
    "treatmentResources.category.selfHelp": "Self-Help",
    "treatmentResources.category.support": "Support Groups",
    // Treatment options
    "treatmentResources.treatment.cbt.title":
      "Cognitive Behavioral Therapy (CBT)",
    "treatmentResources.treatment.cbt.description":
      "Evidence-based therapy focusing on changing thought patterns and behaviors",
    "treatmentResources.treatment.cbt.duration": "12-20 sessions",
    "treatmentResources.treatment.dbt.title":
      "Dialectical Behavior Therapy (DBT)",
    "treatmentResources.treatment.dbt.description":
      "Skills-based therapy for emotional regulation and distress tolerance",
    "treatmentResources.treatment.dbt.duration": "6 months - 1 year",
    "treatmentResources.treatment.mindfulness.title":
      "Mindfulness-Based Stress Reduction",
    "treatmentResources.treatment.mindfulness.description":
      "Meditation and mindfulness practices to reduce anxiety and stress",
    "treatmentResources.treatment.mindfulness.duration": "8-12 weeks",
    "treatmentResources.treatment.supportGroup.title": "Anxiety Support Groups",
    "treatmentResources.treatment.supportGroup.description":
      "Peer support and shared experiences with anxiety management",
    "treatmentResources.treatment.supportGroup.duration": "Ongoing",
    // Chat initial message
    "treatmentResources.chat.initialMessage":
      "Tell me more about {treatment} and how it can help with my anxiety. I'd like to understand the process, what to expect, and if it's right for me.",
    // Toast messages
    "treatmentResources.toast.success": "Success",
    "treatmentResources.toast.downloadSuccess":
      "Conversation summary downloaded successfully",
    "treatmentResources.toast.error": "Error",
    "treatmentResources.toast.downloadError":
      "Failed to download conversation summary",
    // Clinical Assessment
    "assessment.title": "Clinical Assessment",
    "assessment.page.description":
      "Complete this assessment to help us understand your mental health better",
    "assessment.page.backToDashboard": "Back to Dashboard",
    "assessment.questionOf": "Question {current} of {total}",
    "assessment.previous": "Previous",
    "assessment.next": "Next",
    "assessment.complete": "Complete Assessment",
    "assessment.disclaimer.title": "Clinical Assessment Disclaimer",
    "assessment.disclaimer.text":
      "This assessment uses validated clinical screening tools (GAD-7, PHQ-9, PCL-5) for informational purposes only. It does not constitute medical diagnosis or treatment. Results should be discussed with a qualified mental health professional for proper clinical interpretation and care planning.",
    // Assessment options - common
    "assessment.option.notAtAll": "Not at all",
    "assessment.option.severalDays": "Several days",
    "assessment.option.moreThanHalf": "More than half the days",
    "assessment.option.nearlyEveryDay": "Nearly every day",
    "assessment.option.aLittleBit": "A little bit",
    "assessment.option.moderately": "Moderately",
    "assessment.option.quiteABit": "Quite a bit",
    "assessment.option.extremely": "Extremely",
    "assessment.option.never": "Never",
    "assessment.option.oneToTwoTimes": "1-2 times",
    "assessment.option.threeToFiveTimes": "3-5 times",
    "assessment.option.moreThanFiveTimes": "More than 5 times",
    "assessment.option.mildFearAvoidance": "Mild fear/avoidance",
    "assessment.option.moderateFearAvoidance": "Moderate fear/avoidance",
    "assessment.option.severeFearAvoidance": "Severe fear/avoidance",
    "assessment.option.somewhat": "Somewhat",
    "assessment.option.veryMuch": "Very much",
    // GAD-7 Questions
    "assessment.gad7.q1":
      "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
    "assessment.gad7.q2":
      "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
    "assessment.gad7.q3":
      "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
    "assessment.gad7.q4":
      "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
    "assessment.gad7.q5":
      "Over the last 2 weeks, how often have you been bothered by being so restless that it's hard to sit still?",
    "assessment.gad7.q6":
      "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
    "assessment.gad7.q7":
      "Over the last 2 weeks, how often have you been bothered by feeling afraid as if something awful might happen?",
    // PHQ-9 Questions
    "assessment.phq9.q1":
      "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
    "assessment.phq9.q2":
      "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
    "assessment.phq9.q3":
      "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
    "assessment.phq9.q4":
      "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
    "assessment.phq9.q5":
      "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
    "assessment.phq9.q6":
      "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure or have let yourself or your family down?",
    "assessment.phq9.q7":
      "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
    "assessment.phq9.q8":
      "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
    "assessment.phq9.q9":
      "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?",
    // PCL-5 Questions
    "assessment.pcl5.q1":
      "In the past month, how much were you bothered by repeated, disturbing, and unwanted memories of a stressful experience?",
    "assessment.pcl5.q2":
      "In the past month, how much were you bothered by repeated, disturbing dreams of a stressful experience?",
    "assessment.pcl5.q3":
      "In the past month, how much were you bothered by suddenly feeling or acting as if a stressful experience were happening again?",
    "assessment.pcl5.q4":
      "In the past month, how much were you bothered by feeling very upset when something reminded you of a stressful experience?",
    // Social Anxiety and Panic
    "assessment.socialAnxiety":
      "How much do you fear or avoid social situations where you might be judged, embarrassed, or humiliated?",
    "assessment.panicAttacks":
      "In the past month, have you experienced sudden periods of intense fear or discomfort that reached a peak within minutes?",
    // Functional Impairment
    "assessment.functionalImpairment":
      "How much do these problems interfere with your work, school, social activities, or family relationships?",
    // Advanced Anxiety Analysis
    "anxietyAnalysis.title": "Advanced Anxiety Analysis",
    "anxietyAnalysis.anxietyLevel": "Anxiety Level",
    "anxietyAnalysis.gad7Score": "GAD-7 Score",
    "anxietyAnalysis.crisisRisk": "Crisis Risk",
    "anxietyAnalysis.recommended": "Recommended",
    "anxietyAnalysis.gad7.severe": "Severe",
    "anxietyAnalysis.gad7.moderate": "Moderate",
    "anxietyAnalysis.gad7.mild": "Mild",
    "anxietyAnalysis.gad7.minimal": "Minimal",
    "anxietyAnalysis.crisis.critical": "CRITICAL",
    "anxietyAnalysis.crisis.high": "HIGH",
    "anxietyAnalysis.crisis.moderate": "MODERATE",
    "anxietyAnalysis.crisis.low": "LOW",
    "anxietyAnalysis.crisis.criticalDetected": "Critical Risk Detected",
    "anxietyAnalysis.crisis.highDetected": "High Risk Detected",
    "anxietyAnalysis.crisis.warning":
      "Please consider reaching out to a mental health professional or crisis hotline immediately.",
    "anxietyAnalysis.dsm5Indicators": "DSM-5 Indicators:",
    "dsm5.excessiveAnxiety": "Excessive anxiety present",
    "dsm5.multipleTriggers": "Multiple anxiety triggers identified",
    "anxietyAnalysis.beckCategories": "Beck Categories:",
    "anxietyAnalysis.cognitivePatterns": "Cognitive Patterns Detected:",
    "anxietyAnalysis.currentTriggers": "Current Triggers:",
    "anxietyAnalysis.recommendedInterventions": "Recommended Interventions:",
    "anxietyAnalysis.therapyApproach": "Recommended Therapeutic Approach:",
    "anxietyAnalysis.therapy.cbt":
      "Cognitive Behavioral Therapy focuses on identifying and changing negative thought patterns",
    "anxietyAnalysis.therapy.dbt":
      "Dialectical Behavior Therapy helps with emotional regulation and distress tolerance",
    "anxietyAnalysis.therapy.mindfulness":
      "Mindfulness-based approaches focus on present-moment awareness",
    "anxietyAnalysis.therapy.traumaInformed":
      "Trauma-informed care addresses the impact of traumatic experiences",
    "anxietyAnalysis.therapy.supportive":
      "Supportive therapy provides emotional support and validation",
    "anxietyAnalysis.escalation.title": "Anxiety Escalation Detected",
    "anxietyAnalysis.escalation.message":
      "Your anxiety levels appear to be increasing. Consider using grounding techniques or reaching out for support.",
    // Interventions
    "anxietyAnalysis.interventions.deepBreathing":
      "Practice deep breathing exercises",
    "anxietyAnalysis.interventions.progressiveMuscle":
      "Try progressive muscle relaxation",
    "anxietyAnalysis.interventions.grounding":
      "Use grounding techniques (5-4-3-2-1 method)",
    "anxietyAnalysis.interventions.journaling":
      "Consider journaling your thoughts",
    "anxietyAnalysis.interventions.crisisHotline":
      "Contact crisis hotline immediately",
    "anxietyAnalysis.interventions.emergencyServices":
      "Reach out to emergency services if needed",
    "anxietyAnalysis.interventions.boxBreathing": "Box breathing",
    "anxietyAnalysis.interventions.scriptedOpeners": "Scripted openers",
    "anxietyAnalysis.interventions.twoMinuteGroundReframe":
      "2-minute ground + reframe",
    "anxietyAnalysis.interventions.sensory54321": "5-4-3-2-1 sensory",
    "anxietyAnalysis.interventions.outcomeLaddering": "Outcome laddering",
    "anxietyAnalysis.interventions.imperfectReps": "Imperfect reps",
    "anxietyAnalysis.interventions.worryTimeBlocks": "Worry time blocks",
    "anxietyAnalysis.interventions.sleepWindDown": "Sleep wind-down",
    "anxietyAnalysis.interventions.bodyScan": "Body scan",
    "anxietyAnalysis.interventions.scheduledWorryTime": "Scheduled worry time",
    "anxietyAnalysis.interventions.thoughtDefusion": "Thought defusion",
    "anxietyAnalysis.interventions.stimulusControl": "Stimulus control",
    // Avatar
    "avatar.loadingDisabled":
      "3D Avatar Loading Temporarily Disabled During Migration",
    "avatar.isSpeaking": "is Speaking",
    "avatar.speaking": "Speaking...",
    "avatar.listening": "Listening",
    "avatar.currentMood": "Current Mood",
    "avatar.useSimpleAvatar": "Use Simple Avatar",
    "avatar.useRealisticAvatar": "Use Realistic Avatar",
    // Monthly session activity
    "analytics.monthly.sessionActivity": "Monthly Session Activity",
    "analytics.monthly.rangeLabel": "Range",
    "analytics.monthly.change": "Change",
    "analytics.monthly.improving": "Improving",
    "analytics.monthly.declining": "Declining",
    // Therapist auth
    "therapist.title.signin": "Professional Portal",
    "therapist.title.signup": "Join Our Professional Network",
    "therapist.subtitle.signin":
      "Sign in to access your patient management dashboard",
    "therapist.subtitle.signup":
      "Create your professional account to start connecting with patients",
    "therapist.immediateAccess": "Immediate Access",
    "therapist.immediateAccess.desc":
      "You can start using the therapist dashboard right away while we verify your license in the background",
    "therapist.licenseNumber": "License number",
    "therapist.specialty": "Specialty",
    "therapist.yearsExperience": "Years of experience",
    "therapist.applyNow": "Don't have a professional account? Apply now",
    //terms of service
    "termsOfService.title": "Terms of Service",
    "termsOfService.lastUpdated": "Last Updated",
    "termsOfService.agreementToTerms": "Agreement to Terms",
    "termsOfService.agreementToTermsDescription":
      "By using Tranquiloo, you agree to the following terms and conditions.",
    "termsOfService.importantNotice": "Important Notice",
    "termsOfService.importantNoticeDescription": "This is NOT Medical Advice",
    "termsOfService.serviceDescription": "Service Description",
    "termsOfService.serviceDescriptionDescription":
      "Tranquiloo is a mental health support application that provides:",
    "termsOfService.serviceDescriptionItem1":
      "AI-powered conversational therapy and support",
    "termsOfService.serviceDescriptionItem2":
      "Anxiety level tracking and analysis",
    "termsOfService.serviceDescriptionItem3":
      "Goal setting and progress monitoring",
    "termsOfService.serviceDescriptionItem4": "Treatment outcome tracking",
    "termsOfService.serviceDescriptionItem5":
      "Therapist connection and referral services",
    "termsOfService.serviceDescriptionItem6":
      "Mental health resources and educational content",
    "termsOfService.medicalDisclaimer": "Medical Disclaimer",
    "termsOfService.medicalDisclaimerDescription":
      "Tranquiloo is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition.",
    "termsOfService.userResponsibilities": "User Responsibilities",
    "termsOfService.userResponsibilitiesDescription":
      "By using our service, you agree to:",
    "termsOfService.userResponsibilitiesItem1":
      "Provide accurate and complete information when creating your account",
    "termsOfService.userResponsibilitiesItem2":
      "Maintain the confidentiality of your account credentials",
    "termsOfService.userResponsibilitiesItem3":
      "Use the service only for lawful purposes and in accordance with these terms",
    "termsOfService.userResponsibilitiesItem4":
      "Not attempt to gain unauthorized access to our systems or other users' accounts",
    "termsOfService.userResponsibilitiesItem5":
      "Not use the service to transmit harmful, threatening, or inappropriate content",
    "termsOfService.userResponsibilitiesItem6":
      "Respect the intellectual property rights of Tranquiloo and third parties",
    "termsOfService.userResponsibilitiesItem7":
      "Comply with all applicable local, state, and federal laws",
    "termsOfService.emergencySituations": "Emergency Situations",
    "termsOfService.crisisSupport": "Crisis Support",
    "termsOfService.emergencySituationsDescription":
      "If you are experiencing a mental health emergency or having thoughts of self-harm, please contact emergency services immediately:",
    //next line
    "termsOfService.emergencyServices": "Call 911 (Emergency Services)",
    "termsOfService.suicideCrisisLifeline":
      "Call 988 (Suicide & Crisis Lifeline)",
    "termsOfService.crisisTextLine":
      'Text "HELLO" to 741741 (Crisis Text Line)',
    "termsOfService.emergencySituationsDescription2":
      "Tranquiloo is designed to provide support and resources, but it cannot replace immediate professional intervention in crisis situations. Our AI system may detect crisis indicators and provide appropriate resources, but users should always prioritize professional emergency services when needed.",
    "termsOfService.privacyAndDataProtection": "Privacy and Data Protection",
    "termsOfService.privacyAndDataProtectionDescription":
      "Your privacy is paramount to us. Please refer to our Privacy Policy for detailed information about how we collect, use, and protect your personal information.",
    "termsOfService.keyPrivacyHighlights": "Key Privacy Highlights",
    "termsOfService.keyPrivacyHighlightsItem1": "HIPAA compliant data handling",
    "termsOfService.keyPrivacyHighlightsItem2":
      "End-to-end encryption of sensitive information",
    "termsOfService.keyPrivacyHighlightsItem3":
      "No sale or sharing of personal health data",
    "termsOfService.keyPrivacyHighlightsItem4":
      "User control over data retention and deletion",
    "termsOfService.intellectualProperty": "Intellectual Property",
    "termsOfService.intellectualPropertyDescription":
      "All content, features, and functionality of Tranquiloo, including but not limited to:",
    "termsOfService.intellectualPropertyItem1": "Software code and algorithms",
    "termsOfService.intellectualPropertyItem2":
      "Text, graphics, logos, and images",
    "termsOfService.intellectualPropertyItem3":
      "AI models and conversation patterns",
    "termsOfService.intellectualPropertyItem4":
      "User interface and design elements",
    "termsOfService.limitationOfLiability": "Limitation of Liability",
    "termsOfService.limitationOfLiabilityDescription":
      "To the maximum extent permitted by law, Tranquiloo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:",
    "termsOfService.limitationOfLiabilityItem1":
      "Loss of profits, data, or other intangible losses",
    "termsOfService.limitationOfLiabilityItem2":
      "Service interruptions or technical malfunctions",
    "termsOfService.limitationOfLiabilityItem3":
      "Errors or inaccuracies in content or recommendations",
    "termsOfService.limitationOfLiabilityItem4":
      "Unauthorized access to or alteration of your data",
    "termsOfService.limitationOfLiabilityNote": "Note:",
    "termsOfService.limitationOfLiabilityNoteDescription":
      "Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for consequential damages. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.",
    "termsOfService.accountTermination": "Account Termination",
    "termsOfService.userInitiatedTermination": "User-Initiated Termination",
    "termsOfService.userInitiatedTerminationDescription":
      "You may terminate your account at any time through the settings page or by contacting our support team. Upon termination, your access to the service will cease immediately.",
    "termsOfService.serviceInitiatedTermination":
      "Service-Initiated Termination",
    "termsOfService.serviceInitiatedTerminationDescription":
      "We reserve the right to suspend or terminate accounts that violate these terms, engage in harmful behavior, or compromise the security and integrity of our service.",
    "termsOfService.dataRetentionAfterTermination":
      "Data Retention After Termination",
    "termsOfService.dataRetentionAfterTerminationDescription":
      "Upon account termination, we will delete your personal data in accordance with our Privacy Policy and applicable legal requirements, typically within 30 days unless longer retention is required by law.",
    "termsOfService.changesToTerms": "Changes to Terms",
    "termsOfService.changesToTermsDescription":
      "We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting the updated terms on our website. We will notify users of material changes via email and in-app notifications.",
    "termsOfService.changesToTermsDescription2":
      "Your continued use of Tranquiloo after any such changes constitutes your acceptance of the new Terms of Service. If you do not agree to the modified terms, you should discontinue your use of the service.",
    "termsOfService.governingLawAndDisputeResolution":
      "Governing Law and Dispute Resolution",
    "termsOfService.governingLawAndDisputeResolutionDescription":
      "These Terms of Service shall be governed by and construed in accordance with the laws of the United States and the state in which our principal business operations are conducted, without regard to conflict of law principles.",
    "termsOfService.disputeResolutionProcess": "Dispute Resolution Process",
    "termsOfService.disputeResolutionProcessItem1":
      "Initial contact: Attempt to resolve disputes through direct communication",
    "termsOfService.disputeResolutionProcessItem2":
      "Mediation: If direct resolution fails, engage in mediation",
    "termsOfService.disputeResolutionProcessItem3":
      "Arbitration: Binding arbitration for unresolved disputes",
    "termsOfService.disputeResolutionProcessItem4":
      "Legal proceedings: Court action as a last resort",
    "termsOfService.contactInformation": "Contact Information",
    "termsOfService.contactInformationDescription":
      "If you have any questions about these Terms of Service, please contact us:",
    "termsOfService.legalDepartment": "Legal Department",
    "termsOfService.legalDepartmentEmail": "Email: legal@tranquiloo-app.com",
    "termsOfService.legalDepartmentPhone": "Phone: +1-385-867-8804",
    "termsOfService.legalDepartmentResponseTime":
      "Response Time: Within 5 business days",
    //privacy policy
    "privacy.title": "Privacy Policy",
    "privacy.lastUpdated": "Last Updated",
    "privacy.privacyProtection":
      "Privacy Protection (HIPAA readiness in progress)",
    "privacy.privacyProtectionDescription":
      "Tranquiloo is committed to protecting your privacy and maintaining strong data security. We are working toward HIPAA readiness, but we are not yet covered by BAAs with all vendors; please avoid sharing PHI until that is complete. We still encrypt and protect data, but full HIPAA obligations will apply only after BAAs are in place.",
    "privacy.hipaaReadiness": " HIPAA Readiness (In Progress)",
    "privacy.hipaaReadinessDescription":
      "We are working toward HIPAA readiness and formal BAAs. Until then, do not share Protected Health Information (PHI). We still encrypt and protect data, but full HIPAA obligations will apply only after BAAs are in place.",
    "privacy.howWeProtectYourInformation": "How We Protect Your Information",
    "privacy.howWeProtectYourInformationDescription":
      "All data is encrypted both in transit (TLS 1.3) and at rest (AES-256) using industry-standard encryption protocols. Our servers use industry-standard security; we are moving toward BAA-covered infrastructure for HIPAA workloads. Strict access controls ensure only authorized personnel can access your data, and all access is logged.",
    "privacy.informationWeCollect": "Information We Collect",
    "privacy.personalInformation": "Personal Information",
    "privacy.personalInformationItem1":
      "Email address for account creation and authentication",
    "privacy.personalInformationItem2":
      "Phone number if provided for two-factor authentication",
    "privacy.personalInformationItem3":
      "Profile information you choose to share",
    "privacy.healthRelatedInformation": "Health-Related Information",
    "privacy.healthRelatedInformationItem1":
      "Anxiety levels and mood tracking data",
    "privacy.healthRelatedInformationItem2":
      "Conversation transcripts with our AI therapist",
    "privacy.healthRelatedInformationItem3":
      "Goal setting and progress tracking information",
    "privacy.healthRelatedInformationItem4":
      "Treatment outcomes and intervention summaries",
    "privacy.technicalInformation": "Technical Information",
    "privacy.technicalInformationItem1": "Device information and browser type",
    "privacy.technicalInformationItem2":
      "Usage analytics (only if explicitly consented)",
    "privacy.technicalInformationItem3": "Security logs for fraud prevention",
    "privacy.encryption": "Encryption",
    "privacy.encryptionDescription":
      "All data is encrypted both in transit (TLS 1.3) and at rest (AES-256) using industry-standard encryption protocols.",
    "privacy.secureInfrastructure": "Secure Infrastructure",
    "privacy.secureInfrastructureDescription":
      "Our servers use industry-standard security; we are moving toward BAA-covered infrastructure for HIPAA workloads.",
    "privacy.accessControls": "Access Controls",
    "privacy.accessControlsDescription":
      "Strict access controls ensure only authorized personnel can access your data, and all access is logged.",
    "privacy.yourRightsAndChoices": "Your Rights and Choices",
    "privacy.yourRightsAndChoicesDescription":
      "Under HIPAA and State Privacy Laws, you have the right to:",
    "privacy.yourRightsAndChoicesItem1":
      "Access: Request copies of your personal health information",
    "privacy.yourRightsAndChoicesItem2":
      "Rectification: Request correction of inaccurate or incomplete data",
    "privacy.yourRightsAndChoicesItem3":
      "Erasure: Request deletion of your personal information",
    "privacy.yourRightsAndChoicesItem4":
      "Portability: Request your data in a machine-readable format",
    "privacy.yourRightsAndChoicesItem5":
      "Restriction: Request limitation of processing of your data",
    "privacy.yourRightsAndChoicesItem6":
      "Objection: Object to certain types of data processing",
    "privacy.yourRightsAndChoicesItem7":
      "Breach Notification: Be notified of any data breaches within 72 hours",
    "privacy.yourRightsAndChoicesItem8":
      "Portability: Request your data in a machine-readable format",
    "privacy.yourRightsAndChoicesItem9":
      "Restriction: Request limitation of processing of your data",
    "privacy.yourRightsAndChoicesItem10":
      "Objection: Object to certain types of data processing",
    "privacy.yourRightsAndChoicesItem11":
      "Breach Notification: Be notified of any data breaches within 72 hours",
    "privacy.yourRightsAndChoicesItem12":
      "Portability: Request your data in a machine-readable format",
    "privacy.yourRightsAndChoicesItem13":
      "Restriction: Request limitation of processing of your data",
    "privacy.yourRightsAndChoicesItem14":
      "Objection: Object to certain types of data processing",
    "privacy.yourRightsAndChoicesItem15":
      "Breach Notification: Be notified of any data breaches within 72 hours",
    "privacy.stateSpecificCompliance": "State-Specific Compliance",
    "privacy.stateSpecificComplianceDescription":
      "We comply with all applicable state privacy laws including but not limited to:",
    "privacy.stateSpecificComplianceItem1":
      "California Consumer Privacy Act (CCPA)",
    "privacy.stateSpecificComplianceItem2":
      "California Privacy Rights Act (CPRA)",
    "privacy.stateSpecificComplianceItem3":
      "Virginia Consumer Data Protection Act (VCDPA)",
    "privacy.stateSpecificComplianceItem4": "Colorado Privacy Act (CPA)",
    "privacy.stateSpecificComplianceItem5":
      "Connecticut Data Privacy Act (CTDPA)",
    "privacy.stateSpecificComplianceItem6": "Utah Consumer Privacy Act (UCPA)",
    "privacy.stateSpecificComplianceItem7":
      "Illinois Genetic Information Privacy Act",
    "privacy.stateSpecificComplianceItem8":
      "Texas Identity Theft Enforcement and Protection Act",
    "privacy.dataSharingAndThirdParties": "Data Sharing and Third Parties",
    "privacy.dataSharingAndThirdPartiesDescription":
      "We never sell, rent, or share your personal health information with third parties for marketing purposes. Your data is yours and yours alone.",
    "privacy.dataSharingAndThirdPartiesItem1":
      "With your explicit written consent",
    "privacy.dataSharingAndThirdPartiesItem2":
      "When required by law or legal process",
    "privacy.dataSharingAndThirdPartiesItem3":
      "To prevent serious harm to you or others",
    "privacy.dataSharingAndThirdPartiesItem4":
      "For emergency medical treatment",
    "privacy.dataSharingAndThirdPartiesItem5":
      "With HIPAA-compliant service providers who assist in providing our services",
    "privacy.contactInformation": "Contact Information",
    "privacy.contactInformationDescription":
      "If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Privacy Officer:",
    "privacy.privacyOfficer": "Privacy Officer",
    "privacy.privacyOfficerEmail": "Email: privacy@tranquiloo-app.com",
    "privacy.privacyOfficerPhone": "Phone: +1-385-867-8804",
    "privacy.privacyOfficerResponseTime":
      "Response Time: Within 5 business days",
    "privacy.changesToThisPolicy": "Changes to This Policy",
    "privacy.changesToThisPolicyDescription":
      "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by email and by posting the updated policy on our website. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy.",
    "termsOfService.backToSettings": "Back to Settings",
    "chatHistorySidebar.newChat": "New chat",
    "treatmentCreation.createNewGoal": "Create New Goal",
    "treatmentCreation.goalTitle": "Goal Title",
    'goalForm.goalTitle': 'Goal Title',
    "goalForm.placeholder": "e.g., Daily meditation practice",
    "goalForm.editGoal": "Edit Goal",
    "goalForm.createNewGoal": "Create New Goal",
    "goalForm.description": "Description (Optional)",
    "goalForm.placeholderDescription": "Describe your goal in more detail",
    "goalForm.category": "Category",
    "goalForm.selectCategory": "Select a category",
    "goalForm.frequency": "Frequency",
    "goalForm.howOften": "How often?",
    "goalForm.targetValue": "Target Value (Optional)",
    "goalForm.placeholderTargetValue": "e.g., 10",
    "goalForm.unit": "Unit (Optional)",
    "goalForm.placeholderUnit": "e.g., minutes",
    "goalForm.startDate": "Start Date",
    "goalForm.endDate": "End Date (Optional)",
    "goalForm.updateGoal": "Update Goal",
    "goalForm.createGoal": "Create Goal",
    "goalForm.cancel": "Cancel",
    //
    "goalForm.selfCare": "Self Care",
    "goalForm.therapy": "Therapy",
    "goalForm.mindfulness": "Mindfulness",
    "goalForm.exercise": "Exercise",
    "goalForm.social": "Social",
    "goalForm.work": "Work",
    "goalForm.sleep": "Sleep",
    "goalForm.nutrition": "Nutrition",
    "goalForm.daily": "Daily",
    "goalForm.weekly": "Weekly",
    "goalForm.monthly": "Monthly",
    'therapist.connectTherapist': 'Connect Your Therapist',
    'therapist.contactTherapist': 'Contact Therapist',
    'therapist.downloadInformation': 'Download Your Information',
    'therapist.downloadInformationDesc': 'Since you don\'t have a therapist yet, would you like to download your anxiety tracking data and progress reports to share with a future therapist?',
    'therapist.downloadMyAnxietyData': 'Download My Anxiety Data',
    'therapist.returnToDashboard': 'Return to Dashboard',
    'therapist.doYouHaveHealthInsurance': 'Do you have health insurance?',
    'therapist.doYouHaveHealthInsuranceDesc': 'This helps us find therapists that match your coverage and budget.',
    'therapist.yesIHaveHealthInsurance': 'Yes, I have health insurance',
    'therapist.noIDontHaveInsurance': "No, I don't have insurance (show self-pay options)",
    'therapist.findTherapist': 'Find a Therapist',
    'therapist.findTherapistDescYes': 'Connect with licensed therapists that accept your insurance.',
    'therapist.findTherapistDescNo': 'Find therapists offering affordable self-pay options for anxiety management.',
    'therapist.yourZIPCode': 'Your ZIP Code',
    'therapist.enterZIPCode': 'Enter ZIP code',
    'therapist.insuranceProvider': 'Insurance Provider',
    'therapist.selectYourInsurance': 'Select your insurance',
    'therapist.specialtys': 'Specialty',
    'therapist.selectSpecialty': 'Select specialty',
    'therapist.searching': 'Searching...',
    'therapist.searchTherapists': 'Search Therapists',
    'therapist.noTherapistsFound': 'No therapists found',
    'therapist.noTherapistsFoundDesc': 'Try adjusting your search criteria or expanding your location radius.',
    'therapist.modifySearch': 'Modify Search',
    'therapist.website': 'Website',
    'therapist.contact': 'Contact',
    'therapist.yearsExperiences': 'years experience',
    'therapist.acceptingNewPatients': 'Accepting new patients',
    'therapist.notAcceptingNewPatients': 'Not accepting new patients',
    'therapist.therapist': 'therapist',
    'therapist.contactForInsuranceVerification': 'Contact for insurance verification',
    'therapist.selfPayAccepted': 'Self-pay accepted',
    'therapist.insuranceRequired': 'Insurance required',
    'therapist.therapistsAcceptingYourInsurance': 'Therapists accepting your insurance',
    'therapist.therapistsWithSelfPayOptions': 'Therapists with self-pay options',
    'therapist.therapists': 'therapists',
    'therapist.found': 'found',
    'therapist.toast.error': 'Error',
    'therapist.toast.success': 'Success',
    'therapist.toast.pleaseEnterZipCode': 'Please enter a ZIP code',
    'therapist.toast.foundTherapists': 'Found {count} therapists in your area',
    'therapist.toast.failedToFindTherapists': 'Failed to find therapists',
    'therapist.toast.failedToSearch': 'Failed to search for therapists. Please try again.',
    'therapistLinking.connectYourTherapist': 'Connect Your Therapist',
    'therapistLinking.provideTherapistInfo': 'Please provide your therapist\'s information so we can send them an invitation to access your progress data.',
    'therapistLinking.therapistName': 'Therapist\'s Name *',
    'therapistLinking.namePlaceholder': 'Dr. Sarah Johnson',
    'therapistLinking.preferredContactMethod': 'Preferred Contact Method *',
    'therapistLinking.email': 'Email',
    'therapistLinking.emailOnlySupported': 'Currently only email is supported for therapist communication.',
    'therapistLinking.emailAddress': 'Email Address *',
    'therapistLinking.emailPlaceholder': 'sarah.johnson@example.com',
    'therapistLinking.shareReportQuestion': 'Would you like to share your Current History Report?',
    'therapistLinking.shareReportYes': 'Yes, share my Current History Report',
    'therapistLinking.shareReportYesDesc': 'Include Download History Report with anxiety trends and analytics',
    'therapistLinking.shareReportNo': 'No, just send connection request',
    'therapistLinking.shareReportNoDesc': 'Only notify them about the connection without sharing reports',
    'therapistLinking.additionalNotes': 'Additional Notes (Optional)',
    'therapistLinking.notesPlaceholder': 'Any additional information about your therapist or treatment...',
    'therapistLinking.continue': 'Continue',
    'therapistLinking.therapistInfoSaved': 'Therapist Information Saved',
    'therapistLinking.reviewInformation': 'Review Information:',
    'therapistLinking.name': 'Name:',
    'therapistLinking.emailLabel': 'Email:',
    'therapistLinking.shareReport': 'Share Report:',
    'therapistLinking.shareReportYesValue': 'Yes, include Current History Report',
    'therapistLinking.shareReportNoValue': 'No, connection request only',
    'therapistLinking.notes': 'Notes:',
    'therapistLinking.clickToSend': 'Click below to send a connection request to your therapist. They\'ll receive an email',
    'therapistLinking.emailWithReport': ' with your Current History Report including anxiety trends and analytics.',
    'therapistLinking.emailWithoutReport': ' informing them about the connection request.',
    'therapistLinking.toast.nameRequired': 'Name Required',
    'therapistLinking.toast.nameRequiredDesc': 'Please enter your therapist\'s name.',
    'therapistLinking.toast.emailRequired': 'Email Required',
    'therapistLinking.toast.emailRequiredDesc': 'Please enter your therapist\'s email address.',
    'therapistLinking.toast.reportSharingRequired': 'Report Sharing Required',
    'therapistLinking.toast.reportSharingRequiredDesc': 'Please select whether you want to share your Current History Report.',
    'therapistLinking.toast.connectionRequestSent': 'Connection Request Sent',
    'therapistLinking.toast.connectionRequestSentDesc': 'A connection request has been sent to {name}. They will be able to receive your progress reports.',
    'therapistLinking.toast.error': 'Error',
    'therapistLinking.toast.errorDesc': 'Failed to send connection request: {error}',

    // Crisis footer (small fixed site footer)
    "crisisFooter.title": "Crisis?",
    "crisisFooter.call": "Call 988",
    "crisisFooter.text": "Text HOME to 741741",
    "crisisFooter.note": "Not medical advice • Not therapy",
"chatHistory.sourceLabel": "Source",
  },
  es: {
    // Crisis footer (small fixed site footer)
    "crisisFooter.title": "¿Crisis?",
    "crisisFooter.call": "Llama al 988",
    "crisisFooter.text": "Envía HOGAR al 741741",
    "crisisFooter.note": "No es asesoramiento médico • No es terapia",
"chatHistory.sourceLabel": "Fuente",
    "therapist.connectTherapist": "Conecta con tu terapeuta",
"therapist.contactTherapist": "Contactar al terapeuta",
"therapist.downloadInformation": "Descargar tu información",
"therapist.downloadInformationDesc": "Como aún no tienes un terapeuta, ¿quieres descargar tus datos de seguimiento de ansiedad e informes de progreso para compartirlos con un futuro terapeuta?",
"therapist.downloadMyAnxietyData": "Descargar mis datos de ansiedad",
"therapist.returnToDashboard": "Volver al panel",
"therapist.doYouHaveHealthInsurance": "¿Tienes seguro médico?",
"therapist.doYouHaveHealthInsuranceDesc": "Esto nos ayuda a encontrar terapeutas que se ajusten a tu cobertura y presupuesto.",
"therapist.yesIHaveHealthInsurance": "Sí, tengo seguro médico",
"therapist.noIDontHaveInsurance": "No, no tengo seguro (mostrar opciones de pago personal)",
"therapist.findTherapist": "Encontrar un terapeuta",
"therapist.findTherapistDescYes": "Conéctate con terapeutas licenciados que acepten tu seguro.",
"therapist.findTherapistDescNo": "Encuentra terapeutas que ofrezcan opciones de pago personal asequibles para el manejo de la ansiedad.",
"therapist.yourZIPCode": "Tu código postal",
"therapist.enterZIPCode": "Ingresa el código postal",
"therapist.insuranceProvider": "Proveedor de seguro",
"therapist.selectYourInsurance": "Selecciona tu seguro",
"therapist.specialtys": "Especialidad",
"therapist.selectSpecialty": "Selecciona especialidad",
"therapist.searching": "Buscando...",
"therapist.searchTherapists": "Buscar terapeutas",
"therapist.noTherapistsFound": "No se encontraron terapeutas",
"therapist.noTherapistsFoundDesc": "Intenta ajustar tus criterios de búsqueda o ampliar el radio de ubicación.",
"therapist.modifySearch": "Modificar búsqueda",
"therapist.website": "Sitio web",
"therapist.contact": "Contacto",
"therapist.yearsExperiences": "años de experiencia",
"therapist.acceptingNewPatients": "Aceptando nuevos pacientes",
"therapist.notAcceptingNewPatients": "No aceptando nuevos pacientes",
"therapist.therapist": "terapeuta",
"therapist.contactForInsuranceVerification": "Contactar para verificación de seguro",
"therapist.selfPayAccepted": "Pago personal aceptado",
"therapist.insuranceRequired": "Se requiere seguro",
"therapist.therapistsAcceptingYourInsurance": "Terapeutas que aceptan tu seguro",
"therapist.therapistsWithSelfPayOptions": "Terapeutas con opciones de pago personal",
"therapist.therapists": "terapeutas",
"therapist.found": "encontrados",
"therapist.toast.error": "Error",
"therapist.toast.success": "Éxito",
"therapist.toast.pleaseEnterZipCode": "Por favor ingresa un código postal",
"therapist.toast.foundTherapists": "Se encontraron {count} terapeutas en tu área",
"therapist.toast.failedToFindTherapists": "No se pudieron encontrar terapeutas",
"therapist.toast.failedToSearch": "Error al buscar terapeutas. Por favor intenta de nuevo.",
"therapistLinking.connectYourTherapist": "Conecta con tu terapeuta",
"therapistLinking.provideTherapistInfo": "Por favor proporciona la información de tu terapeuta para que podamos enviarle una invitación para acceder a tus datos de progreso.",
"therapistLinking.therapistName": "Nombre del terapeuta *",
"therapistLinking.namePlaceholder": "Dr. Sarah Johnson",
"therapistLinking.preferredContactMethod": "Método de contacto preferido *",
"therapistLinking.email": "Correo electrónico",
"therapistLinking.emailOnlySupported": "Actualmente solo se admite correo electrónico para comunicación con terapeutas.",
"therapistLinking.emailAddress": "Dirección de correo electrónico *",
"therapistLinking.emailPlaceholder": "sarah.johnson@ejemplo.com",
"therapistLinking.shareReportQuestion": "¿Te gustaría compartir tu Informe de Historial Actual?",
"therapistLinking.shareReportYes": "Sí, compartir mi Informe de Historial Actual",
"therapistLinking.shareReportYesDesc": "Incluir Informe de Historial Descargable con tendencias de ansiedad y analíticas",
"therapistLinking.shareReportNo": "No, solo enviar solicitud de conexión",
"therapistLinking.shareReportNoDesc": "Solo notificarlos sobre la conexión sin compartir informes",
"therapistLinking.additionalNotes": "Notas adicionales (Opcional)",
"therapistLinking.notesPlaceholder": "Cualquier información adicional sobre tu terapeuta o tratamiento...",
"therapistLinking.continue": "Continuar",
"therapistLinking.therapistInfoSaved": "Información del terapeuta guardada",
"therapistLinking.reviewInformation": "Revisar información:",
"therapistLinking.name": "Nombre:",
"therapistLinking.emailLabel": "Correo electrónico:",
"therapistLinking.shareReport": "Compartir informe:",
"therapistLinking.shareReportYesValue": "Sí, incluir Informe de Historial Actual",
"therapistLinking.shareReportNoValue": "No, solo solicitud de conexión",
"therapistLinking.notes": "Notas:",
"therapistLinking.clickToSend": "Haz clic abajo para enviar una solicitud de conexión a tu terapeuta. Recibirán un correo electrónico",
"therapistLinking.emailWithReport": " con tu Informe de Historial Actual incluyendo tendencias de ansiedad y analíticas.",
"therapistLinking.emailWithoutReport": " informándoles sobre la solicitud de conexión.",
"therapistLinking.toast.nameRequired": "Nombre requerido",
"therapistLinking.toast.nameRequiredDesc": "Por favor ingresa el nombre de tu terapeuta.",
"therapistLinking.toast.emailRequired": "Correo electrónico requerido",
"therapistLinking.toast.emailRequiredDesc": "Por favor ingresa la dirección de correo electrónico de tu terapeuta.",
"therapistLinking.toast.reportSharingRequired": "Compartir informe requerido",
"therapistLinking.toast.reportSharingRequiredDesc": "Por favor selecciona si deseas compartir tu Informe de Historial Actual.",
"therapistLinking.toast.connectionRequestSent": "Solicitud de conexión enviada",
"therapistLinking.toast.connectionRequestSentDesc": "Se ha enviado una solicitud de conexión a {name}. Podrán recibir tus informes de progreso.",
"therapistLinking.toast.error": "Error",
"therapistLinking.toast.errorDesc": "Error al enviar solicitud de conexión: {error}",
    "main.LookingForPatientSupport":
      "¿Buscas apoyo para pacientes? Inicia sesión aquí",
    // Trigger labels (token-style triggers)
    "trigger.generalWorry": "Preocupación general",
    "trigger.panicAttack": "Ataque de pánico",
    "trigger.physicalSymptoms": "Síntomas físicos",
    "trigger.publicSpeaking": "Hablar en público",
    "trigger.socialSituations": "Situaciones sociales",
    "trigger.crowdedRooms": "Salas abarrotadas",
    "trigger.groupIntroductions": "Presentaciones grupales",
    "trigger.eyeContactDuringPresentations": "Contacto visual durante presentaciones",
    "trigger.heartRacingBeforeMeetings": "Corazón acelerado antes de reuniones",
    "trigger.fearOfJudgment": "Miedo al juicio",
    "trigger.sundayScaries": "Angustias dominicales",
    "trigger.upcomingDeadlines": "Plazos próximos",
    "trigger.sleepDisruption": "Interrupciones del sueño",
    "trigger.lateNightRumination": "Rumiaciones nocturnas",
    "trigger.catastrophicThinking": "Pensamiento catastrófico",
    "trigger.sleepOnset": "Inicio del sueño",
    "trigger.perfectionism": "Perfeccionismo",
    "brand.title": "Compañero de Ansiedad",
    "brand.appName": "Tranquiloo",
    "nav.dashboard": "Panel",
    "nav.chat": "Chat",
    "nav.chatHistory": "Historial de chat",
    "nav.analytics": "Analítica",
    "nav.appointments": "Mis Citas",
    "nav.treatment": "Seguimiento y Tratamiento",
    "nav.contactTherapist": "Contactar terapeuta",
    "nav.settings": "Configuración",
    "nav.help": "Ayuda",
    "mobile.title.analytics": "Analítica",
    "mobile.title.chatHistory": "Historial de chat",
    "mobile.title.chat": "Chat",
    "mobile.title.treatment": "Seguimiento",
    "mobile.title.therapist": "Encontrar terapeuta",
    "mobile.title.settings": "Configuración",
    "mobile.title.help": "Ayuda",
    "mobile.title.dashboard": "Tranquiloo",
    "lang.english": "English",
    "lang.spanish": "Español",
    "lang.switch": "Idioma",
    "nav.share": "Compartir app",
    "nav.logout": "Cerrar sesión",
    "share.title": "Compartir app",
    "share.description":
      "Descubre esta increíble app de acompañamiento en salud mental.",
    "share.copiedTitle": "Enlace copiado",
    "share.copiedDesc": "El enlace de la app se copió al portapapeles.",
    "share.error":
      "No se pudo compartir ahora. Enlace copiado al portapapeles.",
    "analytics.monthly.sampleData.june": "Junio 2025",
    "analytics.monthly.sampleData.july": "Julio 2025",
    // Auth common
    "auth.backHome": "Volver al inicio",
    "auth.welcomeBack": "Bienvenido de nuevo",
    "auth.createAccount": "Crear cuenta",
    "auth.resetPassword": "Restablecer contraseña",
    "auth.resetSubtitle":
      "Te enviaremos instrucciones para restablecer tu contraseña",
    "auth.emailLabel": "Correo electrónico",
    "auth.emailPlaceholder": "Ingresa tu correo",
    "auth.emailHint": "Ingresa el correo asociado a tu cuenta",
    "auth.sendReset": "Enviar enlace",
    "auth.sending": "Enviando...",
    "auth.rememberPassword": "¿Recordaste tu contraseña?",
    "auth.tagline": "Tu camino de salud mental comienza aquí",
    "auth.communityTagline": "Únete a nuestra comunidad de bienestar mental",
    "auth.roleQuestion": "Me registro como:",
    "auth.patientRole": "Paciente",
    "auth.therapistRole": "Terapeuta",
    "auth.haveAccount": "¿Ya tienes una cuenta?",
    "auth.passwordMismatch": "Las contraseñas no coinciden",
    "auth.networkError": "Error de red. Inténtalo de nuevo.",
    "auth.createJourney": "Crea tu cuenta para comenzar tu viaje",
    "auth.resetInstructions":
      "Ingresa tu correo para restablecer tu contraseña",
    "auth.continueGoogle": "Continuar con Google",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.confirmPassword": "Confirmar contraseña",
    "auth.signIn": "Iniciar sesión",
    "auth.signUp": "Registrarse",
    "auth.createAccountCta": "¿No tienes cuenta? Regístrate",
    "auth.orEmail": "O continúa con email",
    "auth.therapistPortal": "Portal de terapeutas",
    "auth.areTherapist": "¿Eres terapeuta? Haz clic aquí",
    "auth.noAccount": "¿No tienes cuenta?",
    "auth.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.patientJourney": "Inicia sesión para continuar tu camino",
    "auth.therapistJourney":
      "Inicia sesión para acceder a tu panel profesional",
    "auth.googleDisclaimer":
      "Estamos trabajando hacia el cumplimiento HIPAA; evita compartir PHI.",
    "auth.firstName": "Nombre",
    "auth.lastName": "Apellido",
    "auth.backToSignIn": "Volver a iniciar sesión",
    "auth.checkEmail": "Revisa tu correo",
    "auth.resetEmailSent":
      "Si existe una cuenta con {email}, enviamos instrucciones para restablecer la contraseña.",
    "auth.resetEmailBody":
      "Revisa tu correo y haz clic en el enlace para crear una nueva contraseña. El enlace expira en 1 hora.",
    "auth.invalidCredentials": "Correo o contraseña inválidos",
    "auth.verifyEmailFirst":
      "Primero verifica tu correo. Revisa tu bandeja de entrada para el enlace de verificación.",
    // Contact therapist
    "contact.title": "Contactar terapeuta",
    "contact.subtitle":
      "Conéctate con tu terapeuta o descarga tus datos de ansiedad para consulta profesional",
    "contact.question": "¿Actualmente tienes un terapeuta?",
    "contact.questionDesc":
      "Si tienes terapeuta, podemos conectar tu cuenta para que sigan tu progreso y te den mejor apoyo.",
    "contact.optionYes": "Sí, quiero conectar a mi terapeuta",
    "contact.optionYesDesc":
      "Envíale una solicitud segura para revisar tu progreso.",
    "contact.optionNo": "No tengo terapeuta",
    "contact.optionNoDesc":
      "Descarga tus datos o explora opciones profesionales.",
    "contact.connectTitle": "Conecta con tu terapeuta",
    "contact.connectDesc":
      "Ingresa el correo de tu terapeuta para enviarle una solicitud de conexión",
    "contact.emailLabel": "Correo del terapeuta",
    "contact.emailPlaceholder": "terapeuta@ejemplo.com",
    "contact.messageLabel": "Mensaje (opcional)",
    "contact.messagePlaceholder":
      "Cuéntale a tu terapeuta tus inquietudes actuales...",
    "contact.sendRequest": "Enviar solicitud de conexión",
    "contact.connecting": "Conectando...",
    "contact.back": "Volver",
    "contact.selfGuidedTitle": "Estás en modo autoguiado",
    "contact.selfGuidedDesc":
      "Sigue usando la app para manejar la ansiedad. Considera conectar con un terapeuta para apoyo profesional.",
    "contact.downloadTitle": "Descarga tus datos de ansiedad",
    "contact.downloadDesc":
      "Obtén tu historial completo y resúmenes para compartir con un profesional de salud mental",
    "contact.packageTitle": "Tu paquete de datos incluye:",
    "contact.packageItem1": "Historial completo y tendencias de ansiedad",
    "contact.packageItem2": "Resúmenes de conversación con la IA",
    "contact.packageItem3": "Análisis de detonantes y patrones",
    "contact.packageItem4": "Progreso de metas y resultados de intervenciones",
    "contact.packageItem5": "Resultados de evaluaciones clínicas",
    "contact.downloadCta": "Descargar mis datos",
    "contact.backOptions": "Volver a opciones",
    "contact.readyTitle": "¿Listo para encontrar un terapeuta?",
    "contact.readyDesc":
      "La terapia profesional puede mejorar significativamente tu manejo de la ansiedad",
    "contact.benefitsTitle": "Beneficios de la terapia profesional:",
    "contact.benefit1":
      "Planes de tratamiento personalizados a tus necesidades",
    "contact.benefit2":
      "Enfoques terapéuticos basados en evidencia (CBT, DBT, etc.)",
    "contact.benefit3": "Apoyo y respuesta profesional en crisis",
    "contact.benefit4": "Manejo de medicación cuando corresponde",
    "contact.benefit5":
      "Recuperación y estrategias de afrontamiento a largo plazo",
    "contact.findTherapist": "Buscar terapeutas cerca de mí",
    "contact.downloadStarted": "Descarga iniciada",
    "contact.downloadStartedDesc":
      "Descargando tus datos de ansiedad y resúmenes de conversación...",
    "contact.downloadError": "Error de descarga",
    "contact.downloadErrorDesc":
      "No se pudieron descargar los datos de ansiedad",
    "contact.emailRequired": "Correo requerido",
    "contact.emailRequiredDesc":
      "Ingresa el correo electrónico de tu terapeuta",
    "contact.requestSent": "Solicitud enviada",
    "contact.requestSentDesc":
      "Tu terapeuta recibirá una notificación para aprobar la conexión",
    "contact.requestError": "Error de conexión",
    "contact.requestErrorDesc":
      "No se pudo conectar con el terapeuta. Inténtalo de nuevo.",
    "contact.emergencyTitle": "Recursos de emergencia",
    "contact.emergency1": "Línea Nacional de Prevención del Suicidio",
    "contact.emergency1Desc": "Apoyo en crisis 24/7",
    "contact.emergency2": "Línea de texto de crisis",
    "contact.emergency2Desc": "Apoyo por texto disponible 24/7",
    "contact.emergency3": "Línea nacional SAMHSA",
    "contact.emergency3Desc": "Referencia a tratamiento e información",
    // Dashboard
    "dashboard.title": "Panel",
    "dashboard.heroTitle": "Guardia de Ansiedad",
    "dashboard.heroSubtitle":
      "Tu compañero de apoyo para la ansiedad con IA. Obtén orientación personalizada, sigue tu progreso y encuentra tranquilidad cuando la necesites.",
    "dashboard.startChatting": "Comenzar chat",
    "dashboard.takeAssessment": "Tomar evaluación",
    "dashboard.trackTreatment": "Seguimiento/Tratamiento",
    "dashboard.analytics": "Analítica",
    "dashboard.feature.safe": "Seguro y privado",
    "dashboard.feature.safeDesc":
      "Tus conversaciones son completamente privadas y seguras",
    "dashboard.feature.support": "Soporte 24/7",
    "dashboard.feature.supportDesc":
      "Siempre disponible cuando necesites hablar",
    "dashboard.feature.personalized": "Cuidado personalizado",
    "dashboard.feature.personalizedDesc":
      "Apoyo adaptado a tus necesidades únicas",
    "dashboard.footer.rights": "Todos los derechos reservados.",
    "dashboard.footer.privacy": "Política de privacidad",
    "dashboard.footer.terms": "Términos de servicio",
    "dashboard.footer.contact": "Contáctanos",
    "dashboard.footer.disclaimer":
      "Esta app no sustituye el consejo, diagnóstico o tratamiento médico profesional. Siempre consulta con tu médico u otro profesional de salud calificado ante cualquier duda sobre una condición médica.",
    "dashboard.footer.version": "Versión",
    // Settings
    "settings.title": "Configuración",
    "settings.subtitle":
      "Personaliza tu experiencia y administra tus preferencias.",
    "settings.account": "Cuenta",
    "settings.accountDesc":
      "Administra la información y configuración de tu cuenta.",
    "settings.currentEmail": "Correo actual",
    "settings.notSignedIn": "No has iniciado sesión",
    "settings.patientCode": "Tu código de paciente",
    "settings.copy": "Copiar",
    "settings.codeCopied": "Código de paciente copiado",
    "settings.shareCodeHint":
      "Comparte este código con tu terapeuta junto con tu correo para que acceda a tus analíticas y datos de tratamiento.",
    "settings.newEmail": "Nuevo correo electrónico",
    "settings.newEmailPlaceholder": "Ingresa nuevo correo",
    "settings.updateEmail": "Actualizar correo",
    "settings.updating": "Actualizando...",
    "settings.emailErrorTitle": "Error",
    "settings.emailErrorDesc": "Ingresa un correo diferente",
    "settings.emailUpdateError": "Error al actualizar correo",
    "settings.emailUpdateErrorDesc": "No se pudo actualizar el correo",
    "settings.emailRequestedTitle": "Solicitud enviada",
    "settings.emailRequestedDesc":
      "Revisa tus correos (el actual y el nuevo) para completar el cambio.",
    "settings.logout": "Cerrar sesión",
    "settings.loggingOut": "Cerrando sesión...",
    "settings.logoutSuccess": "Sesión cerrada",
    "settings.logoutSuccessDesc": "Has salido de tu cuenta.",
    "settings.logoutError": "Error al cerrar sesión",
    "settings.logoutErrorDesc": "No se pudo cerrar sesión",
    "settings.voiceLanguage": "Voz e idioma",
    "settings.voiceLanguageDesc": "Configura cómo la IA habla y responde.",
    "settings.languageLabel": "Idioma",
    "settings.languagePlaceholder": "Selecciona idioma",
    "settings.voiceResponses": "Respuestas de voz",
    "settings.voiceResponsesDesc": "Habilita que la IA hable en voz alta",
    "settings.voiceInterruption": "Interrupción de voz",
    "settings.voiceInterruptionDesc": "Permite interrumpir a la IA hablando",
    "settings.privacy": "Privacidad y datos",
    "settings.privacyDesc": "Controla cómo se almacenan y usan tus datos.",
    "settings.localStorage": "Solo almacenamiento local",
    "settings.localStorageDesc": "Mantén todos los datos en tu dispositivo",
    "settings.analytics": "Permitir analíticas",
    "settings.analyticsDesc": "Ayúdanos a mejorar compartiendo uso anonimizado",
    "settings.dailyCheckIns": "Revisiones diarias",
    "settings.dailyCheckInsDesc": "Recibe recordatorios de ánimo y ansiedad",
    "settings.breathingReminders": "Recordatorios de respiración",
    "settings.breathingRemindersDesc":
      "Recibe recordatorios para ejercicios de respiración",
    "settings.notifications.title": "Notificaciones",
    "settings.notifications.description":
      "Administra cómo y cuándo recibes notificaciones.",
    "settings.about.title": "Acerca de",
    "settings.about.description": "Información sobre la aplicación y soporte.",
    "settings.about.version": "Versión",
    "settings.about.lastUpdated": "Última actualización",
    "settings.about.today": "Hoy",
    "settings.about.privacyPolicy": "Política de privacidad",
    "settings.about.termsOfService": "Términos de servicio",
    "settings.about.support": "Soporte",
    "settings.clearAllData": "Borrar todos los datos",
    "settings.clearAllDataDesc":
      "Esto borrará permanentemente tu historial de conversaciones y configuraciones.",
    // Therapist portal (light)
    "therapistPortal.title": "Portal de terapeutas",
    "therapistPortal.subtitle":
      "Ingresa tu correo para acceder a los datos de progreso de tus pacientes",
    "therapistPortal.emailLabel": "Correo electrónico",
    "therapistPortal.emailPlaceholder": "dr.smith@ejemplo.com",
    "therapistPortal.access": "Acceder al portal",
    "therapistPortal.verifying": "Verificando...",
    "therapistPortal.demoNote": "Nota demo:",
    "therapistPortal.demoBody":
      "Ingresa cualquier correo que tus pacientes hayan usado para conectarse contigo. Este portal muestra las mismas analíticas y resultados que ven los pacientes.",
    "therapistPortal.emailRequired": "Correo requerido",
    "therapistPortal.emailRequiredDesc": "Ingresa tu correo electrónico",
    "therapistPortal.accessGranted": "Acceso concedido",
    "therapistPortal.welcome": "Bienvenido al portal de terapeutas",
    "therapistPortal.errorTitle": "Error",
    "therapistPortal.errorDesc": "No se pudo verificar el acceso",
    "therapistPortal.searchRequired": "Búsqueda requerida",
    "therapistPortal.searchRequiredDesc":
      "Ingresa el correo o código de 6 dígitos del paciente",
    "therapistPortal.noPatients": "No se encontraron pacientes",
    "therapistPortal.noPatientsDesc":
      "No se hallaron pacientes con los criterios ingresados",
    "therapistPortal.searchComplete": "Búsqueda completa",
    "therapist.alreadyHaveAccount":
      "¿Ya tienes una cuenta profesional? Inicia sesión",
    "therapistPortal.searchError": "No se pudo buscar pacientes",
    // Notifications
    "notifications.title": "Notificaciones",
    "notifications.back": "Volver al panel",
    "notifications.new": "nuevas",
    "notifications.markAll": "Marcar todas como leídas",
    "notifications.emptyTitle": "Sin notificaciones",
    "notifications.emptyDesc":
      "¡Estás al día! Vuelve más tarde para actualizaciones.",
    "notifications.markRead": "Marcar como leída",
    "notifications.type.anxiety": "Alerta de ansiedad",
    "notifications.type.treatment": "Actualización de tratamiento",
    "notifications.type.reminder": "Recordatorio",
    "notifications.type.achievement": "Logro",
    "notifications.action.chat": "Hablar con la IA",
    "notifications.action.track": "Registrar tu ánimo",
    "notifications.action.progress": "Ver progreso",
    "notifications.action.chatHistory": "Ver historial de chat",
    "notifications.action.reschedule": "Reprogramar",
    "notifications.action.view": "Ver detalles",
    "notifications.msg.anxiety":
      "Tus niveles de ansiedad han estado elevados los últimos 3 días. Considera ejercicios de respiración o hablar con tu terapeuta.",
    "notifications.msg.achievement":
      "¡Buen trabajo! Llevas 7 días seguidos registrando tu estado de ánimo. Sigue así.",
    "notifications.msg.reminder":
      "Tienes una sesión programada para mañana a las 2:00 PM. No olvides preparar tus notas.",
    "notifications.msg.treatment":
      "Es momento de tu revisión semanal. ¿Cómo te sientes esta semana?",
    // Help
    "help.title": "Centro de ayuda",
    "help.faqTitle": "Preguntas frecuentes",
    "help.faqDesc":
      "Encuentra respuestas a preguntas comunes sobre cómo usar la aplicación",
    "help.q1": "¿Cómo funciona el compañero de IA?",
    "help.a1":
      "El compañero de IA usa procesamiento de lenguaje natural para brindar apoyo personalizado en el manejo de ansiedad. Puede conversar, ofrecer estrategias y ayudarte a seguir tu bienestar emocional.",
    "help.q2": "¿Mis datos son privados y seguros?",
    "help.a2":
      "Sí, tu privacidad es prioridad. Las conversaciones y datos personales están cifrados y almacenados de forma segura. Tienes control total sobre tus datos.",
    "help.q3": "¿Puedo usar la app sin terapeuta?",
    "help.a3":
      "Puedes usarla de forma independiente para manejo diario de ansiedad, aunque recomendamos consultar a un profesional de salud mental para cuidado integral.",
    "help.contactTitle": "Contactar soporte",
    "help.contactDesc":
      "¿No encuentras lo que buscas? Escribe a nuestro equipo de soporte.",
    "help.contactBody":
      "Si tienes preguntas no respondidas en el FAQ, contáctanos. Respondemos normalmente en 24 horas.",
    "help.contactEmailLabel": "Correo",
    "help.contactEmail": "support@anxietycompanion.com",
    // Support page (about/help)
    "support.title": "Centro de soporte",
    "support.subtitle": "Obtén ayuda con Tranquiloo y recursos de salud mental",
    "support.backSettings": "Volver a Configuración",
    "support.contactTeam": "Contacta a nuestro equipo de soporte",
    "support.contactBody":
      "Nuestro equipo está para ayudarte con dudas técnicas o de uso. Respondemos a tiempo para darte la mejor experiencia.",
    "support.emailSupport": "Soporte por correo",
    "support.emailDesc": "Envíanos un mensaje y respondemos en 24 horas.",
    "support.emailCta": "Enviar correo",
    "support.phoneSupport": "Soporte telefónico",
    "support.phoneDesc": "Habla con nuestro equipo para ayuda inmediata.",
    "support.callNow": "Llamar ahora",
    "support.textSupport": "Soporte por texto",
    "support.textDesc":
      "Envía un mensaje para preguntas rápidas o no urgentes.",
    "support.textAvailability": "Disponible 24/7 para soporte no urgente",
    "support.crisisTitle": "Apoyo en crisis y recursos de emergencia",
    "support.crisisLead":
      "Si estás en crisis o tienes pensamientos de autolesión:",
    "support.nationalResources": "Recursos nacionales",
    "support.onlineResources": "Recursos en línea",
    "support.faqTitle": "Preguntas frecuentes",
    "support.faq1.q": "¿Cómo restablezco mi contraseña?",
    "support.faq1.a":
      'Ve a la página de inicio de sesión y haz clic en "Olvidé mi contraseña". Ingresa tu correo y te enviaremos un enlace seguro.',
    "support.faq2.q": "¿Mis datos son seguros y privados?",
    "support.faq2.a":
      "Trabajamos para el cumplimiento total y usamos cifrado para proteger tu información. Revisa la Política de privacidad para más detalles.",
    "support.faq3.q": "¿Puedo exportar mi historial de conversaciones?",
    "support.faq3.a":
      "Puedes descargar resúmenes de conversación y datos de analítica desde las secciones de Analítica y Recursos de tratamiento.",
    "support.faq4.q": "¿Qué tan preciso es el análisis de ansiedad con IA?",
    "support.faq4.a":
      "La IA sigue marcos clínicos de evaluación, pero complementa—no reemplaza—la atención profesional. Consulta a profesionales de salud para decisiones clínicas.",
    "support.faq5.q": "¿Puedo usar Tranquiloo con mi terapeuta?",
    "support.faq5.a":
      "Sí. Comparte analíticas e informes de progreso con tu terapeuta usando la función “Compartir con terapeuta”.",
    "support.faq6.q": "¿Cómo puede mi terapeuta ver mis datos de progreso?",
    "support.faq6.a":
      "Después de conectarlo en la app, puede acceder a su portal para ver analíticas en tiempo real e informes semanales.",
    "support.feedbackAndSuggestions": "Comentarios y Sugerencias",
    "support.feedbackAndSuggestionsDescription":
      "Trabajamos constantemente para mejorar Tranquiloo basándonos en los comentarios de los usuarios. Si tienes sugerencias sobre nuevas funciones, mejoras o comentarios generales sobre tu experiencia, nos encantaría escucharte.",
    "support.shareYourIdeas": "Comparte tus ideas",
    "support.sendYourFeedback": "Envía tus comentarios a:",
    "support.reviewAllFeedback":
      "Revisamos todos los comentarios y priorizamos las funciones en función de las necesidades de los usuarios y el valor clínico.",
    "support.supportHoursAndResponseTimes":
      "Horarios de Soporte y Tiempos de Respuesta",
    "support.businessHours": "Horario de Atención",
    "support.mondayToFriday": "Lunes a Viernes:",
    "support.saturday": "Sábado:",
    "support.sunday": "Domingo:",
    "support.emergencyResources":
      "*Los recursos de emergencia están disponibles las 24 horas, los 7 días de la semana a través de las líneas de crisis mencionadas anteriormente",
    // Crisis resources modal
    "crisisModal.title": "Recursos de apoyo en crisis",
    "crisisModal.subtitle": "Disponible 24/7 cuando necesites apoyo inmediato",
    "crisisModal.hotlinesTitle": "Líneas de crisis 24/7",
    "crisisModal.strategiesTitle": "Ahora mismo: cosas que puedes hacer",
    "crisisModal.rememberLabel": "Recuerda:",
    "crisisModal.rememberText":
      "Si estás en peligro inmediato, llama al 911 o ve a la sala de emergencias más cercana. Estas sensaciones intensas pasarán; ya has superado momentos difíciles antes y también podrás superar este. Importas, y hay personas que quieren ayudarte.",
    "crisisModal.close": "Cerrar",
    "crisisModal.resources.988.name": "Línea 988 de suicidio y crisis",
    "crisisModal.resources.988.description": "Apoyo en crisis 24/7 y prevención del suicidio",
    "crisisModal.resources.textLine.name": "Línea de texto de crisis",
    "crisisModal.resources.textLine.phone": "Envía HOME al 741741",
    "crisisModal.resources.textLine.description": "Apoyo en crisis 24/7 por mensajes de texto",
    "crisisModal.resources.dvHotline.name": "Línea nacional contra la violencia doméstica",
    "crisisModal.resources.dvHotline.description": "Apoyo 24/7 para situaciones de violencia doméstica",
    "crisisModal.resources.samhsa.name": "Línea nacional de ayuda de SAMHSA",
    "crisisModal.resources.samhsa.description":
      "Servicio 24/7 de derivación a tratamiento e información",
    "crisisModal.strategies.grounding54321.title": "Anclaje 5-4-3-2-1",
    "crisisModal.strategies.grounding54321.description":
      "Nombra 5 cosas que ves, 4 que puedes tocar, 3 que oyes, 2 que hueles y 1 que saboreas",
    "crisisModal.strategies.breathing446.title": "Respiración 4-4-6",
    "crisisModal.strategies.breathing446.description":
      "Inhala contando 4, sostén 4 y exhala 6. Repite 10 veces.",
    "crisisModal.strategies.coldWater.title": "Reinicio con agua fría",
    "crisisModal.strategies.coldWater.description":
      "Salpica agua fría en tu cara o sostén cubos de hielo para reiniciar tu sistema nervioso",
    "crisisModal.strategies.movement.title": "Movimiento físico",
    "crisisModal.strategies.movement.description":
      "Haz saltos, flexiones o sal a caminar para liberar tensión",
    "crisisModal.strategies.safePerson.title": "Persona segura",
    "crisisModal.strategies.safePerson.description":
      "Llama o envía un mensaje a una persona que te haga sentir seguro y acompañado",
    "support.responseTimes": "Tiempos de Respuesta",
    "support.phone": "Teléfono:",
    "support.immediateDuringBusinessHours":
      "Inmediato durante el horario de atención",
    "support.email": "Correo electrónico:",
    "support.within24Hours": "Dentro de las 24 horas",
    "support.text": "Mensaje de texto:",
    "support.within4Hours": "Dentro de las 4 horas",
    "support.criticalIssues": "Problemas Críticos:",
    "support.within2Hours": "Dentro de las 2 horas",

    // Therapist dashboard / patient directory
    "therapistDashboard.patientDirectory": "Directorio de pacientes",
    "therapistDashboard.patientDirectoryDesc":
      "Todos tus pacientes aceptados ({count} en total)",
    "therapistDashboard.searchPlaceholder":
      "Buscar por nombre, correo o código de paciente...",
    "therapistDashboard.loadingPatients": "Cargando directorio de pacientes...",
    "therapistDashboard.noPatients": "Aún no hay pacientes",
    "therapistDashboard.noPatientsSearch":
      "No se encontraron pacientes con tu búsqueda",
    "therapistDashboard.active": "Activo",
    "therapistDashboard.sharingReports": "Compartiendo reportes",
    "therapistDashboard.email": "Correo",
    "therapistDashboard.patientCode": "Código de paciente",
    "therapistDashboard.phone": "Teléfono",
    "therapistDashboard.gender": "Género",
    "therapistDashboard.age": "Edad",
    "therapistDashboard.connected": "Conectado",
    "therapistDashboard.years": "años",
    "therapistDashboard.downloads.title": "Tendencias de descargas",
    "therapistDashboard.downloads.noneTitle": "Sin historial de descargas",
    "therapistDashboard.downloads.noneDesc":
      "Aquí verás tu actividad de descargas cuando exportes reportes, gráficos y datos de analítica. Cada descarga se registrará con detalles.",
    "therapistDashboard.downloads.total": "Total de descargas",
    "therapistDashboard.downloads.totalData": "Datos totales",
    "therapistDashboard.downloads.thisWeek": "Esta semana",
    "therapistDashboard.downloads.avgSize": "Tamaño promedio",
    "therapistDashboard.downloads.activity": "Actividad de descargas",
    "therapistDashboard.downloads.category": "Mezcla de categorías de descarga",
    "therapistDashboard.downloads.types.analytics": "Analíticas",
    "therapistDashboard.downloads.types.reports": "Reportes",
    "therapistDashboard.downloads.types.summaries": "Resúmenes",
    "therapistDashboard.downloads.types.exports": "Exportaciones",
    "therapistDashboard.range.allTime": "Todo el tiempo",
    "therapistDashboard.range.select": "Selecciona un rango",
    "therapistDashboard.range.label": "Rango de fechas",
    "therapistDashboard.range.apply": "Aplicar",
    "therapistDashboard.range.clear": "Limpiar",
    // Analytics header
    "analytics.header.title": "Panel de analíticas",
    "analytics.header.data":
      "Mostrando datos de {count} sesiones de análisis de ansiedad",
    "analytics.header.empty":
      "Aún no hay datos; inicia un chat para ver analíticas",
    "analytics.header.downloadHistory": "Descargar historial",
    "analytics.header.downloadSummary": "Descargar resumen de conversación",
    "analytics.header.shareTherapist": "Compartir con terapeuta",
    "analytics.header.viewTreatment": "Ver tratamiento",
    "analytics.header.realtime": "Datos en tiempo real",
    // Analytics metrics
    "analytics.metrics.totalSessions": "Sesiones totales",
    "analytics.metrics.averageAnxiety": "Ansiedad promedio",
    "analytics.metrics.mostCommonTrigger": "Disparador más común",
    "analytics.metrics.noTriggers": "Sin disparadores registrados",
    "analytics.metrics.treatmentProgress": "Progreso del tratamiento",
    "analytics.metrics.progressImproving": "Mejorando",
    // Analytics empty
    "analytics.empty.title": "Aún no hay datos de analíticas",
    "analytics.empty.desc":
      "Comienza a chatear con tu compañera de IA para generar datos de analítica de ansiedad.",
    "analytics.empty.start": "Iniciar chat",
    // Analytics charts
    "analytics.trends.title": "Tendencias semanales por tipo de ansiedad",
    "analytics.trends.none": "Aún no hay datos de tendencias",
    "analytics.trends.work": "Trabajo/Carrera",
    "analytics.trends.social": "Social",
    "analytics.trends.health": "Salud",
    "analytics.trends.financial": "Finanzas",
    "analytics.trends.relationships": "Relaciones",
    "analytics.trends.future": "Futuro/Incertidumbre",
    "analytics.trends.family": "Familia",
    "analytics.distribution.title": "Distribución de Niveles de Ansiedad",
    "analytics.distribution.range.low": "1-3 (Bajo)",
    "analytics.distribution.range.moderate": "4-6 (Moderado)",
    "analytics.distribution.range.high": "7-8 (Alto)",
    "analytics.distribution.range.severe": "9-10 (Severo)",
    "analytics.distribution.tooltip.sessions": "Sesiones",
    "analytics.distribution.tooltip.percentage": "Porcentaje",
    // Treatment outcomes
    "analytics.outcomes.change": "Cambio",
    "analytics.outcomes.status": "Estado",
    "analytics.outcomes.treatmentEffectiveness.improving": "Mejorando",
    "analytics.outcomes.treatmentEffectiveness.stable": "Estable",
    "analytics.outcomes.treatmentEffectiveness.declining": "Empeorando",
    "analytics.triggers.title": "Análisis de detonantes",
    "analytics.triggers.total": "Entradas totales: {count}",
    "analytics.triggers.trigger": "Detonante",
    "analytics.triggers.count": "Cantidad",
    "analytics.triggers.avgSeverity": "Severidad prom.",
    "analytics.triggers.trend": "Tendencia",
    "analytics.triggers.related": "Detonantes relacionados",
    "analytics.triggers.why": "Por qué sucede",
    "analytics.triggers.description": "Descripción",
    "analytics.triggers.evidence": "Evidencia clínica",
    "analytics.triggers.trendLabel": "Tendencia",
    "analytics.triggers.recalledContext": "Contexto recordado",
    "analytics.triggers.aggravators": "Factores que agravan",
    "analytics.triggers.impact": "Impacto/Evitación",
    "analytics.triggers.lastOccurrence": "Última ocurrencia",
    "analytics.triggers.relatedPatterns": "Patrones de detonantes relacionados",
    "analytics.triggers.patternNotedGeneral":
      "Patrón observado para ansiedad general; detalles limitados registrados. Se recomienda registrar cuándo/dónde/señales corporales para refinar el plan.",
    "analytics.triggers.healthConcernsNarrative":
      "El paciente reporta ansiedad con preocupaciones de salud, recordando síntomas físicos. Los síntomas se intensifican con sensaciones corporales y noticias médicas, llevando a un monitoreo de la salud.",
    // Trigger categories
    "analytics.triggers.category.socialAnxiety": "Ansiedad Social",
    "analytics.triggers.category.generalAnxiety": "Ansiedad General",
    "analytics.triggers.category.healthConcerns": "Preocupaciones de Salud",
    // Patient narrative translations
    "analytics.triggers.patientReports.social": "El paciente reporta ansiedad con situaciones sociales, recordando",
    "analytics.triggers.patientReports.work": "El paciente reporta ansiedad con situaciones laborales/académicas, recordando",
    "analytics.triggers.patientReports.financial": "El paciente reporta ansiedad con asuntos financieros, recordando",
    "analytics.triggers.patientReports.relationships": "El paciente reporta ansiedad con relaciones, recordando",
    "analytics.triggers.patientReports.uncertainty": "El paciente reporta ansiedad con incertidumbre, recordando",
    "analytics.triggers.symptomsIntensify": "Los síntomas se intensifican con",
    "analytics.triggers.leadingTo": "llevando a",
    // Memory contexts
    "analytics.triggers.memoryContext.encountersAttractive": "encuentros con individuos atractivos",
    "analytics.triggers.memoryContext.pastCriticism": "experiencias pasadas de crítica",
    "analytics.triggers.memoryContext.difficultConversations": "conversaciones pasadas difíciles",
    "analytics.triggers.memoryContext.performanceReviews": "revisiones de desempeño pasadas",
    "analytics.triggers.memoryContext.previousSetbacks": "reveses anteriores",
    "analytics.triggers.memoryContext.visaConcerns": "preocupaciones de visa",
    "analytics.triggers.memoryContext.physicalSymptoms": "síntomas físicos",
    "analytics.triggers.memoryContext.healthScares": "sustos de salud pasados",
    "analytics.triggers.memoryContext.financialStruggles": "luchas financieras pasadas",
    "analytics.triggers.memoryContext.jobLoss": "pérdida de empleo",
    "analytics.triggers.memoryContext.familyConflicts": "conflictos familiares",
    "analytics.triggers.memoryContext.relationshipChallenges": "desafíos de relación",
    "analytics.triggers.memoryContext.uncertainOutcomes": "resultados inciertos",
    "analytics.triggers.memoryContext.socialSituations": "situaciones sociales",
    "analytics.triggers.memoryContext.workplaceChallenges": "desafíos laborales",
    "analytics.triggers.memoryContext.variousSituations": "situaciones diversas",
    // Aggravators
    "analytics.triggers.aggravator.eyeContact": "contacto visual",
    "analytics.triggers.aggravator.unexpectedEncounters": "encuentros inesperados",
    "analytics.triggers.aggravator.beingObserved": "ser observado",
    "analytics.triggers.aggravator.performanceSituations": "situaciones de rendimiento",
    "analytics.triggers.aggravator.groupSettings": "entornos grupales",
    "analytics.triggers.aggravator.unfamiliarPeople": "personas desconocidas",
    "analytics.triggers.aggravator.crowdedSpaces": "espacios concurridos",
    "analytics.triggers.aggravator.unexpectedAttention": "atención inesperada",
    "analytics.triggers.aggravator.deadlines": "plazos",
    "analytics.triggers.aggravator.evaluations": "evaluaciones",
    "analytics.triggers.aggravator.highStakesTasks": "tareas de alto riesgo",
    "analytics.triggers.aggravator.competition": "competencia",
    "analytics.triggers.aggravator.timePressure": "presión de tiempo",
    "analytics.triggers.aggravator.performanceExpectations": "expectativas de rendimiento",
    "analytics.triggers.aggravator.bodySensations": "sensaciones corporales",
    "analytics.triggers.aggravator.medicalNews": "noticias médicas",
    "analytics.triggers.aggravator.billsArriving": "llegada de facturas",
    "analytics.triggers.aggravator.budgetDiscussions": "discusiones presupuestarias",
    "analytics.triggers.aggravator.arguments": "argumentos",
    "analytics.triggers.aggravator.emotionalDistance": "distancia emocional",
    "analytics.triggers.aggravator.lackOfControl": "falta de control",
    "analytics.triggers.aggravator.unpredictableChanges": "cambios impredecibles",
    "analytics.triggers.aggravator.stress": "estrés",
    "analytics.triggers.aggravator.unexpectedEvents": "eventos inesperados",
    // Impacts
    "analytics.triggers.impact.avoidanceSocialVenues": "evitación de lugares sociales",
    "analytics.triggers.impact.socialWithdrawal": "retiro social",
    "analytics.triggers.impact.limitingInteractions": "limitación de interacciones sociales",
    "analytics.triggers.impact.socialAvoidance": "evitación social",
    "analytics.triggers.impact.procrastination": "procrastinación",
    "analytics.triggers.impact.selfDoubt": "duda propia",
    "analytics.triggers.impact.workAvoidance": "evitación laboral",
    "analytics.triggers.impact.careerLimitations": "limitaciones profesionales",
    "analytics.triggers.impact.healthMonitoring": "monitoreo de salud",
    "analytics.triggers.impact.spendingRestrictions": "restricciones de gasto",
    "analytics.triggers.impact.relationshipStrain": "tensión en las relaciones",
    "analytics.triggers.impact.decisionParalysis": "parálisis de decisión",
    "analytics.triggers.impact.dailyFunctioning": "funcionamiento diario",
    // Fallback pattern
    "analytics.triggers.fallbackPattern": "Patrón observado para {trigger}; detalles limitados registrados. Se recomienda registrar cuándo/dónde/señales corporales para refinar el plan.",
    // Related trigger names
    "analytics.triggers.relatedTrigger.crowdedRooms": "habitaciones concurridas",
    "analytics.triggers.relatedTrigger.groupIntroductions": "presentaciones grupales",
    "analytics.triggers.relatedTrigger.eyeContactPresentations": "contacto visual durante presentaciones",
    "analytics.triggers.relatedTrigger.heartRacingMeetings": "corazón acelerado antes de reuniones",
    "analytics.triggers.relatedTrigger.perfectionism": "perfeccionismo",
    "analytics.triggers.relatedTrigger.sundayScaries": "miedos del domingo",
    "analytics.triggers.relatedTrigger.fearOfJudgment": "miedo al juicio",
    "analytics.triggers.relatedTrigger.socialAnxiety": "ansiedad social",
    "analytics.triggers.relatedTrigger.workStress": "estrés laboral",
    "analytics.triggers.relatedTrigger.healthConcerns": "preocupaciones de salud",
    "analytics.triggers.relatedTrigger.financialStress": "estrés financiero",
    "analytics.triggers.relatedTrigger.relationshipIssues": "problemas de relación",
    // More triggers message
    "analytics.triggers.moreTriggers": "más detonantes que requieren análisis",
    // Evidence line translations
    "analytics.triggers.evidenceLabel": "Evidencia: Último episodio",
    "analytics.triggers.severityScale": "/10",
    "analytics.triggers.episodesIn": "episodios en",
    "analytics.triggers.vsPrior": "vs anterior",
    // Time windows
    "analytics.triggers.timeWindow.pastMonth": "mes pasado",
    "analytics.triggers.timeWindow.pastTwoWeeks": "últimas dos semanas",
    "analytics.triggers.timeWindow.pastWeek": "semana pasada",
    "analytics.triggers.timeWindow.pastYear": "año pasado",
    // Trends
    "analytics.triggers.trend.increasing": "aumentando",
    "analytics.triggers.trend.decreasing": "disminuyendo",
    "analytics.triggers.trend.stable": "estable",
    // Date terms
    "analytics.triggers.date.today": "hoy",
    "analytics.triggers.date.yesterday": "ayer",
    "analytics.triggers.date.recently": "recientemente",
    "analytics.triggers.date.oneDayAgo": "hace 1 día",
    "analytics.triggers.date.daysAgo": "hace {count} días",
    "analytics.triggers.date.oneWeekAgo": "hace 1 semana",
    "analytics.triggers.date.weeksAgo": "hace {count} semanas",
    // Anxiety tracker
    "analytics.tracker.title": "Tus analíticas y seguimiento de ansiedad",
    "analytics.tracker.emptyTitle": "Analítica y seguimiento de ansiedad",
    "analytics.tracker.improving": "MEJORANDO",
    "analytics.tracker.worsening": "EMPEORANDO",
    "analytics.tracker.stable": "ESTABLE",
    "analytics.tracker.emptyDesc":
      "Comienza a chatear para ver analíticas y seguimiento de intervenciones.",
    "analytics.tracker.startChat": "Iniciar sesión de chat",
    "analytics.tracker.avgAnxiety": "Ansiedad promedio",
    "analytics.tracker.avgGad7": "GAD-7 promedio",
    "analytics.tracker.sessions": "Sesiones",
    "analytics.tracker.trend": "Tendencia",
    "analytics.tracker.mostEffective": "Intervenciones más efectivas para ti:",
    "analytics.tracker.effectiveness": "efectividad",
    "analytics.tracker.used": "Usado {count}x",
    "analytics.tracker.recentProgress": "Tu progreso reciente:",
    "analytics.tracker.progressImproving":
      "🎉 ¡Gran progreso! Tus niveles de ansiedad han disminuido. Sigue usando las intervenciones que mejor te funcionan.",
    "analytics.tracker.progressStable":
      "📊 Tus niveles de ansiedad están estables. Considera probar nuevas intervenciones o aumentar la frecuencia de las actuales.",
    "analytics.tracker.progressWorsening":
      "🤗 Tus niveles de ansiedad han aumentado recientemente. Es normal; considera buscar apoyo adicional o usar intervenciones de crisis.",
    // Treatment outcomes
    "analytics.outcomes.title": "Resultados del tratamiento",
    "analytics.outcomes.emptyDesc":
      "Comienza a seguir tu ansiedad para ver resultados y tendencias.",
    "analytics.outcomes.anxietyLevel": "Nivel de ansiedad",
    // Monthly charts
    "analytics.monthly.title": "Tendencias mensuales por categoría",
    "analytics.monthly.none":
      "Agrega más sesiones para ver tendencias mensuales.",
    // Chat history
    "chatHistory.title": "Historial de chat",
    "chatHistory.subtitle":
      "Revisa tus conversaciones e intervenciones previas",
    "chatHistory.recentConversations": "Conversaciones recientes",
    "chatHistory.sessionsDesc": "Tus sesiones de chat con las compañeras de IA",
    "chatHistory.analyticsTitle": "Análisis de ansiedad",
    "chatHistory.analyticsDesc": "Análisis generados por IA de tus chats",
    "chatHistory.low": "Bajo",
    "chatHistory.moderate": "Moderado",
    "chatHistory.high": "Alto",
    "chatHistory.noSessions": "Aún no hay sesiones de chat",
    "chatHistory.noSessionsDesc":
      "Comienza una conversación para ver tu historial aquí",
    "chatHistory.untitled": "Chat sin título",
    "chatHistory.viewConversation": "Ver conversación",
    "chatHistory.anxietyLevel": "Nivel de ansiedad",
    "chatHistory.interventions": "Intervenciones de ansiedad",
    "chatHistory.interventionsDesc":
      "Análisis de ansiedad y estrategias de afrontamiento impulsadas por IA",
    "chatHistory.identifiedTriggers": "Disparadores identificados",
    "chatHistory.copingStrategies": "Estrategias de afrontamiento",
    "chatHistory.aiResponse": "Respuesta de IA",
    "chatHistory.noAnalyses": "Aún no hay análisis de ansiedad",
    "chatHistory.noAnalysesDesc":
      "Chatea con nuestras compañeras de IA para recibir apoyo personalizado",
    // Chat header
    "chat.header.vanessaTitle": "Apoyo avanzado para la ansiedad con Vanessa",
    "chat.header.monicaTitle": "Apoyo avanzado para la ansiedad con Mónica",
    "chat.header.vanessaSubtitle":
      "Compañera IA con análisis clínico y soporte de voz",
    "chat.header.monicaSubtitle":
      "Compañera IA con análisis clínico y soporte de voz",
    "chat.header.warning":
      "Las funciones de voz no están disponibles en este navegador. Aún puedes chatear escribiendo.",
    "chat.header.mobileHistory": "Historial",
    "chat.header.badge.es": "Español",
    "chat.welcome.vanessa":
      "¡Hola! Soy Vanessa, tu compañera avanzada de IA para la ansiedad. Estoy aquí para brindarte apoyo con base clínica usando enfoques terapéuticos actualizados. ¿Cómo te sientes hoy?",
    "chat.error.tryAgain":
      "Estoy teniendo problemas para responder en este momento. Por favor inténtalo de nuevo en un momento",

    // Appointments
    "appointments.back": "Volver",
    "appointments.title": "Mis citas",
    "appointments.subtitle": "Programa y gestiona tus sesiones de terapia",
    // Goals
    "analytics.goals.title": "Resumen de progreso de metas",
    "analytics.goals.emptyTitle": "Aún no hay metas",
    "analytics.goals.emptyDesc":
      "Crea metas para seguir tu progreso y ver analíticas.",
    "analytics.goals.total": "Metas",
    "analytics.goals.completed": "Completadas",
    "analytics.goals.inProgress": "En progreso",
    "analytics.goals.avgScore": "Puntaje prom.",
    "analytics.goals.adherence": "Adherencia",
    "analytics.goals.history": "Historial de progreso",
    "analytics.goals.category": "Categoría",
    "analytics.goals.badge.completed": "Completada",
    "analytics.goals.badge.good": "Buen progreso",
    "analytics.goals.badge.started": "Comenzando",
    "analytics.goals.badge.new": "Meta nueva",
    "analytics.goals.progressLabel": "Progreso",
    "analytics.goals.scoreLabel": "Puntaje",
    // Mock goals translations
    "goals.goal1.title": "Practica respiración profunda diariamente",
    "goals.goal1.description":
      "Haz 10 minutos de ejercicios de respiración profunda cada mañana",
    "goals.goal1.notes.progress1": "Me sentí bien hoy",
    "goals.goal1.notes.progress2": "Muy relajante",
    "goals.goal2.title": "Ejercítate 3 veces por semana",
    "goals.goal2.description": "Sal a caminar o trotar durante 30 minutos",
    "goals.goal2.notes.progress3": "Buen paseo en el parque",
    "goals.seed.dailyGrounding.title": "Práctica diaria de grounding",
    "goals.seed.dailyGrounding.description": "5-10 minutos de respiración/escaneo corporal después del almuerzo",
    "goals.seed.exposure.title": "Repeticiones de exposición",
    "goals.seed.exposure.description": "Exposiciones intencionales con comportamientos de seguridad reducidos",
    // Goal frequency translations
    "goals.frequency.daily": "diario",
    "goals.frequency.weekly": "semanal",
    "goals.frequency.monthly": "mensual",
    "goals.frequency.3x/week": "3 veces por semana",
    // Goal unit translations
    "goals.unit.minutes": "minutos",
    "goals.unit.times": "veces",
    "goals.unit.sessions/week": "sesiones/semana",
    "goals.unit.exposures/week": "exposiciones/semana",
    // Goal tracker UI translations
    "goals.tracker.loading": "Cargando metas...",
    "goals.tracker.emptyTitle": "Aún no hay metas",
    "goals.tracker.emptyDesc":
      "Crea tu primera meta para comenzar a seguir tu progreso hacia una mejor salud mental.",
    "goals.tracker.emptyCta": "Crea tu primera meta",
    "goals.tracker.title": "Tus Metas",
    "goals.tracker.description":
      "Rastrea tu progreso hacia una mejor salud mental",
    "goals.tracker.addGoal": "Agregar Meta",
    "goals.tracker.latestProgress": "Último Progreso",
    "goals.tracker.recordProgress": "Registrar Progreso",
    "goals.tracker.averageScore": "Puntaje Promedio",
    "goals.tracker.completionRate": "Tasa de Finalización",
    // Goal progress form
    "goals.progressForm.title": "Registrar Progreso",
    "goals.progressForm.instruction":
      "¿Qué tan bien lograste esta meta hoy? Califica del 1 (muy difícil) al 10 (excelente).",
    "goals.progressForm.scoreLabel": "Puntaje de Progreso",
    "goals.progressForm.score.excellent": "¡Excelente progreso!",
    "goals.progressForm.score.good": "Buen progreso",
    "goals.progressForm.score.making": "Haciendo progreso",
    "goals.progressForm.score.challenges": "Algunos desafíos",
    "goals.progressForm.score.difficult": "Día difícil",
    "goals.progressForm.slider.veryDifficult": "Muy Difícil (1)",
    "goals.progressForm.slider.excellent": "Excelente (10)",
    "goals.progressForm.notesLabel": "Notas (Opcional)",
    "goals.progressForm.notesPlaceholder":
      "Agrega cualquier nota sobre tu progreso, desafíos o pensamientos...",
    "goals.progressForm.submitButton": "Registrar Progreso",
    "goals.progressForm.cancelButton": "Cancelar",
    // Goal categories translations
    "goals.category.mindfulness": "Atención plena",
    "goals.category.exercise": "Ejercicio",
    "goals.category.treatment": "Tratamiento",
    "goals.category.self-care": "Autocuidado",
    "goals.category.therapy": "Terapia",
    "goals.category.social": "Social",
    "goals.category.work": "Trabajo",
    "goals.category.sleep": "Sueño",
    "goals.category.nutrition": "Nutrición",
    // Treatment outcomes charts
    "analytics.outcomes.trendTitle":
      "Tendencias del nivel de ansiedad promedio",
    "analytics.outcomes.trendEmptyTitle": "Aún no hay datos de tendencias",
    "analytics.outcomes.trendEmptyDesc":
      "Comienza a registrar tus niveles de ansiedad para ver tendencias de progreso",
    "analytics.outcomes.weeklyTitle": "Resultados semanales del tratamiento",
    "analytics.outcomes.avgAnxiety": "Ansiedad prom.",
    "analytics.outcomes.trendLabel": "Tendencia",
    "analytics.outcomes.treatmentEffectiveness": "Efectividad del tratamiento",
    // Appointments
    "appointments.header": "Programar cita",
    "appointments.subheader":
      "Agenda una sesión de video o audio con tu terapeuta",
    "appointments.therapist": "Terapeuta *",
    "appointments.selectTherapist": "Selecciona un terapeuta",
    "appointments.noConnectionsTitle": "Sin terapeutas conectados",
    "appointments.noConnectionsDesc":
      "Debes conectar con un terapeuta antes de agendar citas.",
    "appointments.connectCta": "Haz clic aquí para conectar con un terapeuta",
    "appointments.connectHow":
      'Cómo funciona: Ve a "Contactar terapeuta", envía el correo de tu terapeuta y espera a que acepte la conexión.',
    "appointments.date": "Fecha *",
    "appointments.time": "Hora *",
    "appointments.duration": "Duración",
    "appointments.duration.30": "30 minutos",
    "appointments.duration.45": "45 minutos",
    "appointments.duration.60": "60 minutos (1 hora)",
    "appointments.duration.90": "90 minutos (1.5 horas)",
    "appointments.sessionType": "Tipo de sesión *",
    "appointments.video": "Sesión por video",
    "appointments.audio": "Sesión de audio",
    "appointments.inPerson": "Sesión presencial",
    "appointments.videoDesc": "Sesión cara a cara",
    "appointments.audioDesc": "Solo voz",
    "appointments.inPersonDesc": "Encuentro en el consultorio",
    "appointments.notes": "Notas (opcional)",
    "appointments.notesPlaceholder":
      "Temas o preocupaciones que deseas tratar...",
    "appointments.important": "Información importante",
    "appointments.info.internet":
      "Tú y tu terapeuta necesitan conexión a internet",
    "appointments.info.recording":
      "Las sesiones pueden grabarse para calidad; estamos trabajando hacia cumplimiento HIPAA",
    "appointments.info.reminder":
      "Recibirás un recordatorio 1 hora antes de tu cita",
    "appointments.info.early": "Únete 5 minutos antes para probar la conexión",
    "appointments.scheduleCta": "Programar cita",
    "appointments.scheduling": "Agendando...",
    "appointments.missing": "Información faltante",
    "appointments.missingDesc": "Completa todos los campos requeridos",
    "appointments.scheduledTitle": "Cita agendada",
    "appointments.scheduledDesc": "Tu cita se agendó correctamente",
    "appointments.failedTitle": "Error al agendar",
    "appointments.failedDesc":
      "No se pudo agendar la cita. Intenta nuevamente.",
    "appointments.cancelConfirm": "¿Seguro que deseas cancelar esta cita?",
    "appointments.cancelledTitle": "Cita cancelada",
    "appointments.cancelledDesc": "Tu cita ha sido cancelada",
    "appointments.cancelFailedTitle": "Error al cancelar",
    "appointments.cancelFailedDesc": "No se pudo cancelar la cita",
    "appointments.joinFailedTitle": "Error al unirse",
    "appointments.joinFailedDesc": "No se pudo unir a la cita",
    "appointments.inPersonInfo":
      "Esta cita es presencial. Llega unos minutos antes y lleva tu material si es necesario.",
    "appointments.noUpcoming": "Sin próximas citas",
    "appointments.noUpcomingDesc": "Agenda tu primera cita arriba",
    "appointments.upcomingTab": "Próximas",
    "appointments.pastTab": "Pasadas",
    "appointments.status.scheduled": "Programada",
    "appointments.status.confirmed": "Confirmada",
    "appointments.status.inProgress": "En progreso",
    "appointments.status.completed": "Completada",
    "appointments.status.cancelled": "Cancelada",
    "appointments.loading": "Cargando citas...",
    "appointments.noPast": "Sin citas pasadas",
    "appointments.noPastDesc":
      "Tus citas pasadas aparecerán aquí después de asistir o completarlas.",
    "appointments.joinWindow":
      "Puedes unirte 10 minutos antes de tu hora programada.",
    "appointments.openLink": "Abrir enlace",
    "appointments.copyButton": "Copiar",
    "appointments.joinVia": "Unirse vía Tranquiloo",
    "appointments.durationLabel": "Duración",
    "appointments.minutesShort": "min",
    "appointments.noLinkYet":
      "Tu terapeuta compartirá el enlace antes de la sesión, o puedes unirte a través de Tranquiloo abajo.",
    "appointments.therapistLabel": "Terapeuta",
    "appointments.join": "Unirse",
    "appointments.cancel": "Cancelar",
    "appointments.copyLink": "Enlace copiado al portapapeles",
    "appointments.copyFailed": "No se pudo copiar el enlace",
    "appointments.linkCopiedTitle": "Enlace copiado",
    "appointments.copyFailedTitle": "Fallo al copiar",
    // Intervention summaries & treatment insights
    "interventions.title": "Resúmenes de intervenciones",
    "interventions.badge": "Actualizado con datos de sesión",
    "interventions.tabs.overview": "Resumen",
    "interventions.tabs.session": "Sesión",
    "interventions.tabs.week": "Semanal",
    "interventions.tabs.month": "Mensual",
    "interventions.tabs.year": "Anual",
    "interventions.recent": "Sesiones recientes",
    "interventions.weeklyOverview": "Resumen semanal",
    "interventions.monthlyOverview": "Resumen mensual",
    "interventions.yearlyOverview": "Resumen anual",
    "interventions.noRecent": "No hay resúmenes recientes de sesión.",
    "interventions.noWeekly": "Aún no hay resúmenes semanales.",
    "interventions.noMonthly": "Aún no hay resúmenes mensuales.",
    "interventions.noYearly": "Aún no hay resúmenes anuales.",
    "interventions.sessions": "sesiones",
    "interventions.trend": "Tendencia",
    "interventions.snapshot": "Resumen del paciente",
    "interventions.progressObserved": "Progreso observado",
    "interventions.avgAnxiety": "Ansiedad prom.",
    "interventions.topTriggers": "Principales detonantes",
    "interventions.noTriggers": "No se documentaron detonantes específicos.",
    "interventions.therapyApplied": "Terapia aplicada",
    "interventions.adherence": "adherencia",
    "interventions.noTherapies":
      "No se documentaron intervenciones en este periodo.",
    "interventions.clinicalNotes": "Notas clínicas",
    "interventions.noNotes":
      "No hay notas clínicas documentadas en este periodo.",
    "interventions.homework": "Próximos pasos / tarea",
    "interventions.homeworkFallback":
      "Continúa con el plan de afrontamiento acordado",
    "interventions.forClinicians": "Para clínicos",
    "interventions.noData": "Sin periodo previo",
    "interventions.progressImproving": "Mejorando",
    "interventions.progressNeedsSupport": "Requiere apoyo",
    "interventions.progressStable": "Estable",
    "interventions.trend.upVsPrior": "↑ {delta} vs periodo anterior",
    "interventions.trend.downVsPrior": "↓ {delta} vs periodo anterior",
    "interventions.patientProblem.withTrigger":
      "El paciente experimentó ansiedad elevada alrededor de {trigger}. La severidad promedió {avg}/10.",
    "interventions.patientProblem.noTrigger":
      "El paciente reportó ansiedad promedio de {avg}/10 sin un detonante claro.",
    "interventions.progressSummary": "{direction}: Respuesta inmediata {trend}.",
    "interventions.avgAnxietyRange": "{label} {avg}/10 (rango {min}–{max}).",
    "interventions.homeworkTemplate":
      "Tarea principal: {task}. Refuerza la práctica 3×/día o según lo indicado.",
    "interventions.adherence.partial": "Parcial",
    "pattern.noteWithFocus":
      "Patrón observado: {pattern}. Prioriza reinicios cortos del sistema nervioso, luego la exposición reduciendo los comportamientos de seguridad en un 20%.",
    "pattern.socialPerformanceAnxiety": "Ansiedad social + de rendimiento (presentaciones, entornos grupales)",
    // Treatment insights blocks
    "treatment.insights.title": "Perspectivas de tratamiento para terapeutas",
    "treatment.insights.currentTrend": "Tendencia actual",
    "treatment.insights.interventionSuccess": "Éxito de intervenciones",
    "treatment.insights.noData":
      "Reúne más datos con el tiempo para ver patrones de efectividad del tratamiento.",
    "treatment.insights.weeksImproved":
      "{improved} de {total} semanas mostraron mejora",
    "treatment.insights.decliningResults":
      "El tratamiento muestra resultados {status} con un nivel de ansiedad promedio de {anxiety}/10",
    // Track outcomes/treatment page
    "treatmentResources.title": "Seguimiento de resultados y tratamiento",
    "treatmentResources.subtitle":
      "Monitorea tu progreso, registra metas y accede a tratamientos basados en evidencia",
    "treatmentResources.download": "Descargar resumen de conversaciones",
    "treatmentResources.connect": "Conectar con terapeuta",
    "treatmentResources.noActiveTitle": "Sin tratamiento activo",
    "treatmentResources.noActiveDesc":
      "Según tus patrones de ansiedad, recomendamos iniciar con un terapeuta profesional",
    "treatmentResources.takeAssessment": "Tomar evaluación",
    "treatmentResources.findTherapist": "Buscar terapeuta",
    "treatmentResources.goalsTitle": "Tus metas",
    "treatmentResources.goalsSubtitle":
      "Sigue tu progreso hacia una mejor salud mental",
    // Treatment options
    "treatmentResources.recommendedOptions":
      "Opciones de Tratamiento Recomendadas",
    "treatmentResources.recommended": "Recomendado",
    "treatmentResources.duration": "Duración",
    "treatmentResources.effectiveness": "efectividad",
    "treatmentResources.effectiveness.high": "alta",
    "treatmentResources.effectiveness.moderate": "moderada",
    "treatmentResources.learnMore": "Saber Más",
    // Treatment categories
    "treatmentResources.category.all": "Todos los Recursos",
    "treatmentResources.category.therapy": "Terapia Profesional",
    "treatmentResources.category.selfHelp": "Autoayuda",
    "treatmentResources.category.support": "Grupos de Apoyo",
    // Treatment options
    "treatmentResources.treatment.cbt.title":
      "Terapia Cognitivo Conductual (TCC)",
    "treatmentResources.treatment.cbt.description":
      "Terapia basada en evidencia enfocada en cambiar patrones de pensamiento y comportamientos",
    "treatmentResources.treatment.cbt.duration": "12-20 sesiones",
    "treatmentResources.treatment.dbt.title":
      "Terapia Dialéctica Conductual (TDC)",
    "treatmentResources.treatment.dbt.description":
      "Terapia basada en habilidades para la regulación emocional y tolerancia al malestar",
    "treatmentResources.treatment.dbt.duration": "6 meses - 1 año",
    "treatmentResources.treatment.mindfulness.title":
      "Reducción del Estrés Basada en Atención Plena",
    "treatmentResources.treatment.mindfulness.description":
      "Prácticas de meditación y atención plena para reducir la ansiedad y el estrés",
    "treatmentResources.treatment.mindfulness.duration": "8-12 semanas",
    "treatmentResources.treatment.supportGroup.title":
      "Grupos de Apoyo para Ansiedad",
    "treatmentResources.treatment.supportGroup.description":
      "Apoyo entre pares y experiencias compartidas sobre el manejo de la ansiedad",
    "treatmentResources.treatment.supportGroup.duration": "Continuo",
    // Chat initial message
    "treatmentResources.chat.initialMessage":
      "Cuéntame más sobre {treatment} y cómo puede ayudar con mi ansiedad. Me gustaría entender el proceso, qué esperar y si es adecuado para mí.",
    // Toast messages
    "treatmentResources.toast.success": "Éxito",
    "treatmentResources.toast.downloadSuccess":
      "Resumen de conversación descargado exitosamente",
    "treatmentResources.toast.error": "Error",
    "treatmentResources.toast.downloadError":
      "Error al descargar el resumen de conversación",
    // Clinical Assessment
    "assessment.title": "Evaluación Clínica",
    "assessment.page.description":
      "Completa esta evaluación para ayudarnos a entender mejor tu salud mental",
    "assessment.page.backToDashboard": "Volver al Panel",
    "assessment.questionOf": "Pregunta {current} de {total}",
    "assessment.previous": "Anterior",
    "assessment.next": "Siguiente",
    "assessment.complete": "Completar Evaluación",
    "assessment.disclaimer.title":
      "Descargo de Responsabilidad de la Evaluación Clínica",
    "assessment.disclaimer.text":
      "Esta evaluación utiliza herramientas de detección clínica validadas (GAD-7, PHQ-9, PCL-5) solo con fines informativos. No constituye un diagnóstico médico ni tratamiento. Los resultados deben discutirse con un profesional de salud mental calificado para una interpretación clínica adecuada y planificación de cuidados.",
    // Assessment options - common
    "assessment.option.notAtAll": "Nada en absoluto",
    "assessment.option.severalDays": "Varios días",
    "assessment.option.moreThanHalf": "Más de la mitad de los días",
    "assessment.option.nearlyEveryDay": "Casi todos los días",
    "assessment.option.aLittleBit": "Un poco",
    "assessment.option.moderately": "Moderadamente",
    "assessment.option.quiteABit": "Bastante",
    "assessment.option.extremely": "Extremadamente",
    "assessment.option.never": "Nunca",
    "assessment.option.oneToTwoTimes": "1-2 veces",
    "assessment.option.threeToFiveTimes": "3-5 veces",
    "assessment.option.moreThanFiveTimes": "Más de 5 veces",
    "assessment.option.mildFearAvoidance": "Miedo/evitación leve",
    "assessment.option.moderateFearAvoidance": "Miedo/evitación moderado",
    "assessment.option.severeFearAvoidance": "Miedo/evitación severo",
    "assessment.option.somewhat": "Algo",
    "assessment.option.veryMuch": "Mucho",
    // GAD-7 Questions
    "assessment.gad7.q1":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por sentirte nervioso, ansioso o al límite?",
    "assessment.gad7.q2":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por no poder detener o controlar la preocupación?",
    "assessment.gad7.q3":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por preocuparte demasiado por diferentes cosas?",
    "assessment.gad7.q4":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por tener problemas para relajarte?",
    "assessment.gad7.q5":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por estar tan inquieto que es difícil quedarse quieto?",
    "assessment.gad7.q6":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por molestarte o irritarte fácilmente?",
    "assessment.gad7.q7":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por sentir miedo como si algo terrible pudiera pasar?",
    // PHQ-9 Questions
    "assessment.phq9.q1":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por poco interés o placer en hacer cosas?",
    "assessment.phq9.q2":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por sentirte deprimido, triste o sin esperanza?",
    "assessment.phq9.q3":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por problemas para conciliar o mantener el sueño, o dormir demasiado?",
    "assessment.phq9.q4":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por sentirte cansado o tener poca energía?",
    "assessment.phq9.q5":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por poco apetito o comer en exceso?",
    "assessment.phq9.q6":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por sentirte mal contigo mismo o que eres un fracaso o has decepcionado a ti mismo o a tu familia?",
    "assessment.phq9.q7":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por problemas para concentrarte en cosas, como leer el periódico o ver televisión?",
    "assessment.phq9.q8":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por moverte o hablar tan lentamente que otras personas podrían haberlo notado? O lo contrario: estar tan inquieto o nervioso que te has movido mucho más de lo habitual?",
    "assessment.phq9.q9":
      "Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido molesto por pensamientos de que estarías mejor muerto o de lastimarte?",
    // PCL-5 Questions
    "assessment.pcl5.q1":
      "En el último mes, ¿qué tanto te molestaron los recuerdos repetidos, perturbadores y no deseados de una experiencia estresante?",
    "assessment.pcl5.q2":
      "En el último mes, ¿qué tanto te molestaron los sueños repetidos y perturbadores de una experiencia estresante?",
    "assessment.pcl5.q3":
      "En el último mes, ¿qué tanto te molestó sentir o actuar repentinamente como si una experiencia estresante estuviera sucediendo de nuevo?",
    "assessment.pcl5.q4":
      "En el último mes, ¿qué tanto te molestó sentirte muy molesto cuando algo te recordó una experiencia estresante?",
    // Social Anxiety and Panic
    "assessment.socialAnxiety":
      "¿Qué tanto temes o evitas situaciones sociales donde podrías ser juzgado, avergonzado o humillado?",
    "assessment.panicAttacks":
      "En el último mes, ¿has experimentado períodos repentinos de miedo o malestar intenso que alcanzaron un pico en minutos?",
    // Functional Impairment
    "assessment.functionalImpairment":
      "¿Qué tanto interfieren estos problemas con tu trabajo, escuela, actividades sociales o relaciones familiares?",
    // Advanced Anxiety Analysis
    "anxietyAnalysis.title": "Análisis Avanzado de Ansiedad",
    "anxietyAnalysis.anxietyLevel": "Nivel de Ansiedad",
    "anxietyAnalysis.gad7Score": "Puntaje GAD-7",
    "anxietyAnalysis.crisisRisk": "Riesgo de Crisis",
    "anxietyAnalysis.recommended": "Recomendado",
    "anxietyAnalysis.gad7.severe": "Severo",
    "anxietyAnalysis.gad7.moderate": "Moderado",
    "anxietyAnalysis.gad7.mild": "Leve",
    "anxietyAnalysis.gad7.minimal": "Mínimo",
    "anxietyAnalysis.crisis.critical": "CRÍTICO",
    "anxietyAnalysis.crisis.high": "ALTO",
    "anxietyAnalysis.crisis.moderate": "MODERADO",
    "anxietyAnalysis.crisis.low": "BAJO",
    "anxietyAnalysis.crisis.criticalDetected": "Riesgo Crítico Detectado",
    "anxietyAnalysis.crisis.highDetected": "Riesgo Alto Detectado",
    "anxietyAnalysis.crisis.warning":
      "Por favor considera contactar a un profesional de salud mental o línea de crisis inmediatamente.",
    "anxietyAnalysis.dsm5Indicators": "Indicadores DSM-5:",
    "dsm5.excessiveAnxiety": "Ansiedad excesiva presente",
    "dsm5.multipleTriggers": "Múltiples desencadenantes de ansiedad identificados",
    "anxietyAnalysis.beckCategories": "Categorías de Beck:",
    "anxietyAnalysis.cognitivePatterns": "Patrones Cognitivos Detectados:",
    "anxietyAnalysis.currentTriggers": "Desencadenantes Actuales:",
    "anxietyAnalysis.recommendedInterventions": "Intervenciones Recomendadas:",
    "anxietyAnalysis.therapyApproach": "Enfoque Terapéutico Recomendado:",
    "anxietyAnalysis.therapy.cbt":
      "La Terapia Cognitivo Conductual se enfoca en identificar y cambiar patrones de pensamiento negativos",
    "anxietyAnalysis.therapy.dbt":
      "La Terapia Dialéctica Conductual ayuda con la regulación emocional y tolerancia al malestar",
    "anxietyAnalysis.therapy.mindfulness":
      "Los enfoques basados en atención plena se centran en la conciencia del momento presente",
    "anxietyAnalysis.therapy.traumaInformed":
      "La atención informada sobre trauma aborda el impacto de experiencias traumáticas",
    "anxietyAnalysis.therapy.supportive":
      "La terapia de apoyo proporciona apoyo emocional y validación",
    "anxietyAnalysis.escalation.title": "Escalada de Ansiedad Detectada",
    "anxietyAnalysis.escalation.message":
      "Tus niveles de ansiedad parecen estar aumentando. Considera usar técnicas de conexión a tierra o buscar apoyo.",
    // Interventions
    "anxietyAnalysis.interventions.deepBreathing":
      "Practica ejercicios de respiración profunda",
    "anxietyAnalysis.interventions.progressiveMuscle":
      "Prueba la relajación muscular progresiva",
    "anxietyAnalysis.interventions.grounding":
      "Usa técnicas de conexión a tierra (método 5-4-3-2-1)",
    "anxietyAnalysis.interventions.journaling":
      "Considera escribir un diario de tus pensamientos",
    "anxietyAnalysis.interventions.crisisHotline":
      "Contacta la línea de crisis inmediatamente",
    "anxietyAnalysis.interventions.emergencyServices":
      "Contacta los servicios de emergencia si es necesario",
    "anxietyAnalysis.interventions.boxBreathing": "Respiración en caja",
    "anxietyAnalysis.interventions.scriptedOpeners": "Frases de apertura preparadas",
    "anxietyAnalysis.interventions.twoMinuteGroundReframe":
      "Anclaje de 2 minutos + replanteamiento",
    "anxietyAnalysis.interventions.sensory54321": "Técnica sensorial 5-4-3-2-1",
    "anxietyAnalysis.interventions.outcomeLaddering": "Escalera de resultados",
    "anxietyAnalysis.interventions.imperfectReps": "Repeticiones imperfectas",
    "anxietyAnalysis.interventions.worryTimeBlocks": "Bloques de tiempo para preocuparse",
    "anxietyAnalysis.interventions.sleepWindDown": "Rutina de relajación antes de dormir",
    "anxietyAnalysis.interventions.bodyScan": "Escaneo corporal",
    "anxietyAnalysis.interventions.scheduledWorryTime": "Tiempo de preocupación programado",
    "anxietyAnalysis.interventions.thoughtDefusion": "Defusión de pensamientos",
    "anxietyAnalysis.interventions.stimulusControl": "Control de estímulos",
    // Avatar
    "avatar.loadingDisabled":
      "Carga de Avatar 3D Temporalmente Deshabilitada Durante la Migración",
    "avatar.isSpeaking": "está Hablando",
    "avatar.speaking": "Hablando...",
    "avatar.listening": "Escuchando",
    "avatar.currentMood": "Estado de Ánimo Actual",
    "avatar.useSimpleAvatar": "Usar Avatar Simple",
    "avatar.useRealisticAvatar": "Usar Avatar Realista",
    // Monthly session activity
    "analytics.monthly.sessionActivity": "Actividad de sesiones mensuales",
    "analytics.monthly.rangeLabel": "Rango",
    "analytics.monthly.change": "Cambio",
    "analytics.monthly.improving": "Mejorando",
    "analytics.monthly.declining": "Empeorando",
    "chatHistorySidebar.noChatsFound": "No se encontraron chats",
    "chatHistorySidebar.noConversationsYet": "Aún no hay conversaciones",
    "chatHistorySidebar.tryDifferentSearch": "Intenta una búsqueda diferente",
    "chatHistorySidebar.startChatting":
      "Comienza a chatear para ver tu historial aquí",
    "chatHistorySidebar.noChatsFoundDesc":
      "Inicia un nuevo chat para ver tu historial de conversaciones",
    "chatHistorySidebar.yesterday": "Ayer",
    "chatHistorySidebar.thisWeek": "Esta semana",
    "chatHistorySidebar.older": "Anteriores",

    // Therapist auth
    "therapist.title.signin": "Portal profesional",
    "therapist.title.signup": "Únete a nuestra red profesional",
    "therapist.subtitle.signin":
      "Inicia sesión para acceder a tu panel profesional",
    "therapist.subtitle.signup":
      "Crea tu cuenta profesional para conectar con pacientes",
    "therapist.immediateAccess": "Acceso inmediato",
    "therapist.immediateAccess.desc":
      "Puedes usar el panel mientras verificamos tu licencia en segundo plano",
    "therapist.licenseNumber": "Número de licencia",
    "therapist.specialty": "Especialidad",
    "therapist.yearsExperience": "Años de experiencia",
    "therapist.applyNow": "¿No tienes cuenta profesional? Solicítala aquí",
    //terms of service
    "termsOfService.title": "Términos de Servicio",
    "termsOfService.lastUpdated": "Última actualización",
    "termsOfService.agreementToTerms": "Aceptación de los Términos",
    "termsOfService.agreementToTermsDescription":
      "Al utilizar Tranquiloo, aceptas los siguientes términos y condiciones.",
    "termsOfService.importantNotice": "Aviso Importante",
    "termsOfService.importantNoticeDescription":
      "Esto NO es asesoramiento médico",
    "termsOfService.serviceDescription": "Descripción del Servicio",
    "termsOfService.serviceDescriptionDescription":
      "Tranquiloo es una aplicación de apoyo a la salud mental que ofrece:",
    "termsOfService.serviceDescriptionItem1":
      "Terapia conversacional y apoyo impulsados por IA",
    "termsOfService.serviceDescriptionItem2":
      "Seguimiento y análisis del nivel de ansiedad",
    "termsOfService.serviceDescriptionItem3":
      "Establecimiento de objetivos y monitoreo del progreso",
    "termsOfService.serviceDescriptionItem4":
      "Seguimiento de resultados del tratamiento",
    "termsOfService.serviceDescriptionItem5":
      "Servicios de conexión y derivación a terapeutas",
    "termsOfService.serviceDescriptionItem6":
      "Recursos de salud mental y contenido educativo",
    "termsOfService.medicalDisclaimer": "Descargo de Responsabilidad Médica",
    "termsOfService.medicalDisclaimerDescription":
      "Tranquiloo no sustituye el asesoramiento, diagnóstico ni tratamiento médico profesional. Consulta siempre a profesionales de la salud calificados ante cualquier duda relacionada con una condición médica.",
    "termsOfService.userResponsibilities": "Responsabilidades del Usuario",
    "termsOfService.userResponsibilitiesDescription":
      "Al utilizar nuestro servicio, aceptas:",
    "termsOfService.userResponsibilitiesItem1":
      "Proporcionar información precisa y completa al crear tu cuenta",
    "termsOfService.userResponsibilitiesItem2":
      "Mantener la confidencialidad de las credenciales de tu cuenta",
    "termsOfService.userResponsibilitiesItem3":
      "Usar el servicio únicamente con fines legales y de acuerdo con estos términos",
    "termsOfService.userResponsibilitiesItem4":
      "No intentar obtener acceso no autorizado a nuestros sistemas o a las cuentas de otros usuarios",
    "termsOfService.userResponsibilitiesItem5":
      "No utilizar el servicio para transmitir contenido dañino, amenazante o inapropiado",
    "termsOfService.userResponsibilitiesItem6":
      "Respetar los derechos de propiedad intelectual de Tranquiloo y de terceros",
    "termsOfService.userResponsibilitiesItem7":
      "Cumplir con todas las leyes locales, estatales y federales aplicables",
    "termsOfService.emergencySituations": "Situaciones de Emergencia",
    "termsOfService.crisisSupport": "Apoyo en Crisis",
    "termsOfService.emergencySituationsDescription":
      "Si estás experimentando una emergencia de salud mental o tienes pensamientos de autolesión, comunícate de inmediato con los servicios de emergencia:",
    "termsOfService.emergencyServices":
      "Llama al 911 (Servicios de Emergencia)",
    "termsOfService.suicideCrisisLifeline":
      "Llama al 988 (Línea de Prevención del Suicidio y Crisis)",
    "termsOfService.crisisTextLine":
      'Envía un mensaje de texto con "HELLO" al 741741 (Línea de Texto de Crisis)',
    "termsOfService.emergencySituationsDescription2":
      "Tranquiloo está diseñado para brindar apoyo y recursos, pero no puede reemplazar la intervención profesional inmediata en situaciones de crisis. Nuestro sistema de IA puede detectar indicadores de crisis y proporcionar recursos adecuados, pero los usuarios siempre deben priorizar los servicios de emergencia profesionales cuando sea necesario.",
    "termsOfService.privacyAndDataProtection":
      "Privacidad y Protección de Datos",
    "termsOfService.privacyAndDataProtectionDescription":
      "Tu privacidad es fundamental para nosotros. Consulta nuestra Política de Privacidad para obtener información detallada sobre cómo recopilamos, usamos y protegemos tu información personal.",
    "termsOfService.keyPrivacyHighlights": "Aspectos Clave de Privacidad",
    "termsOfService.keyPrivacyHighlightsItem1":
      "Manejo de datos conforme a HIPAA",
    "termsOfService.keyPrivacyHighlightsItem2":
      "Cifrado de extremo a extremo de información sensible",
    "termsOfService.keyPrivacyHighlightsItem3":
      "No venta ni compartición de datos personales de salud",
    "termsOfService.keyPrivacyHighlightsItem4":
      "Control del usuario sobre la retención y eliminación de datos",
    "termsOfService.intellectualProperty": "Propiedad Intelectual",
    "termsOfService.intellectualPropertyDescription":
      "Todo el contenido, las funciones y la funcionalidad de Tranquiloo, incluidos, entre otros:",
    "termsOfService.intellectualPropertyItem1":
      "Código de software y algoritmos",
    "termsOfService.intellectualPropertyItem2":
      "Texto, gráficos, logotipos e imágenes",
    "termsOfService.intellectualPropertyItem3":
      "Modelos de IA y patrones de conversación",
    "termsOfService.intellectualPropertyItem4":
      "Interfaz de usuario y elementos de diseño",
    "termsOfService.limitationOfLiability": "Limitación de Responsabilidad",
    "termsOfService.limitationOfLiabilityDescription":
      "En la máxima medida permitida por la ley, Tranquiloo no será responsable de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluidos, entre otros:",
    "termsOfService.limitationOfLiabilityItem1":
      "Pérdida de beneficios, datos u otras pérdidas intangibles",
    "termsOfService.limitationOfLiabilityItem2":
      "Interrupciones del servicio o fallos técnicos",
    "termsOfService.limitationOfLiabilityItem3":
      "Errores o inexactitudes en el contenido o las recomendaciones",
    "termsOfService.limitationOfLiabilityItem4":
      "Acceso no autorizado o alteración de tus datos",
    "termsOfService.limitationOfLiabilityNote": "Nota:",
    "termsOfService.limitationOfLiabilityNoteDescription":
      "Algunas jurisdicciones no permiten la exclusión de ciertas garantías o la limitación de responsabilidad por daños consecuentes. En dichas jurisdicciones, nuestra responsabilidad se limitará en la máxima medida permitida por la ley.",
    "termsOfService.accountTermination": "Cancelación de la Cuenta",
    "termsOfService.userInitiatedTermination":
      "Cancelación Iniciada por el Usuario",
    "termsOfService.userInitiatedTerminationDescription":
      "Puedes cancelar tu cuenta en cualquier momento a través de la página de configuración o contactando a nuestro equipo de soporte. Tras la cancelación, tu acceso al servicio cesará de inmediato.",
    "termsOfService.serviceInitiatedTermination":
      "Cancelación Iniciada por el Servicio",
    "termsOfService.serviceInitiatedTerminationDescription":
      "Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos, participen en conductas dañinas o comprometan la seguridad e integridad de nuestro servicio.",
    "termsOfService.dataRetentionAfterTermination":
      "Retención de Datos Tras la Cancelación",
    "termsOfService.dataRetentionAfterTerminationDescription":
      "Tras la cancelación de la cuenta, eliminaremos tus datos personales de acuerdo con nuestra Política de Privacidad y los requisitos legales aplicables, generalmente dentro de un plazo de 30 días, a menos que la ley exija una retención más prolongada.",
    "termsOfService.changesToTerms": "Cambios en los Términos",
    "termsOfService.changesToTermsDescription":
      "Nos reservamos el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios entrarán en vigor inmediatamente después de la publicación de los términos actualizados en nuestro sitio web. Notificaremos a los usuarios sobre cambios sustanciales por correo electrónico y mediante notificaciones dentro de la aplicación.",
    "termsOfService.changesToTermsDescription2":
      "El uso continuado de Tranquiloo después de dichos cambios constituye tu aceptación de los nuevos Términos de Servicio. Si no estás de acuerdo con los términos modificados, debes dejar de utilizar el servicio.",
    "termsOfService.governingLawAndDisputeResolution":
      "Ley Aplicable y Resolución de Disputas",
    "termsOfService.governingLawAndDisputeResolutionDescription":
      "Estos Términos de Servicio se regirán e interpretarán de conformidad con las leyes de los Estados Unidos y del estado en el que se desarrollen nuestras principales operaciones comerciales, sin tener en cuenta los principios sobre conflictos de leyes.",
    "termsOfService.disputeResolutionProcess":
      "Proceso de Resolución de Disputas",
    "termsOfService.disputeResolutionProcessItem1":
      "Contacto inicial: Intentar resolver las disputas mediante comunicación directa",
    "termsOfService.disputeResolutionProcessItem2":
      "Mediación: Si la resolución directa falla, recurrir a mediación",
    "termsOfService.disputeResolutionProcessItem3":
      "Arbitraje: Arbitraje vinculante para disputas no resueltas",
    "termsOfService.disputeResolutionProcessItem4":
      "Procedimientos legales: Acción judicial como último recurso",
    "termsOfService.contactInformation": "Información de Contacto",
    "termsOfService.contactInformationDescription":
      "Si tienes alguna pregunta sobre estos Términos de Servicio, contáctanos:",
    "termsOfService.legalDepartment": "Departamento Legal",
    "termsOfService.legalDepartmentEmail":
      "Correo electrónico: legal@tranquiloo-app.com",
    "termsOfService.legalDepartmentPhone": "Teléfono: +1-385-867-8804",
    "termsOfService.legalDepartmentResponseTime":
      "Tiempo de respuesta: Dentro de 5 días hábiles",
    //privacy policy
    "privacy.title": "Política de Privacidad",
    "privacy.lastUpdated": "Última actualización",
    "privacy.privacyProtection":
      "Protección de la Privacidad (Preparación para HIPAA en progreso)",
    "privacy.privacyProtectionDescription":
      "Tranquiloo se compromete a proteger tu privacidad y a mantener una sólida seguridad de los datos. Estamos trabajando para cumplir con los requisitos de HIPAA, pero aún no contamos con Acuerdos de Asociado Comercial (BAA) con todos los proveedores; por favor, evita compartir Información de Salud Protegida (PHI) hasta que este proceso se complete. Aun así, ciframos y protegemos los datos, pero las obligaciones completas de HIPAA solo se aplicarán una vez que los BAA estén en vigor.",
    "privacy.hipaaReadiness": "Preparación para HIPAA (En Progreso)",
    "privacy.hipaaReadinessDescription":
      "Estamos trabajando para cumplir con HIPAA y formalizar los BAA. Hasta entonces, no compartas Información de Salud Protegida (PHI). Aun así, ciframos y protegemos los datos, pero las obligaciones completas de HIPAA solo se aplicarán una vez que los BAA estén en vigor.",
    "privacy.howWeProtectYourInformation": "Cómo Protegemos tu Información",
    "privacy.howWeProtectYourInformationDescription":
      "Todos los datos se cifran tanto en tránsito (TLS 1.3) como en reposo (AES-256) utilizando protocolos de cifrado estándar de la industria. Nuestros servidores utilizan medidas de seguridad estándar de la industria; estamos avanzando hacia una infraestructura cubierta por BAA para cargas de trabajo HIPAA. Controles de acceso estrictos garantizan que solo el personal autorizado pueda acceder a tus datos, y todo acceso queda registrado.",
    "privacy.informationWeCollect": "Información que Recopilamos",
    "privacy.personalInformation": "Información Personal",
    "privacy.personalInformationItem1":
      "Dirección de correo electrónico para la creación y autenticación de la cuenta",
    "privacy.personalInformationItem2":
      "Número de teléfono si se proporciona para la autenticación de dos factores",
    "privacy.personalInformationItem3":
      "Información del perfil que elijas compartir",
    "privacy.healthRelatedInformation": "Información Relacionada con la Salud",
    "privacy.healthRelatedInformationItem1":
      "Niveles de ansiedad y datos de seguimiento del estado de ánimo",
    "privacy.healthRelatedInformationItem2":
      "Transcripciones de conversaciones con nuestro terapeuta de IA",
    "privacy.healthRelatedInformationItem3":
      "Información sobre establecimiento de objetivos y seguimiento del progreso",
    "privacy.healthRelatedInformationItem4":
      "Resultados del tratamiento y resúmenes de intervenciones",
    "privacy.technicalInformation": "Información Técnica",
    "privacy.technicalInformationItem1":
      "Información del dispositivo y tipo de navegador",
    "privacy.technicalInformationItem2":
      "Análisis de uso (solo con consentimiento explícito)",
    "privacy.technicalInformationItem3":
      "Registros de seguridad para la prevención de fraudes",
    "privacy.encryption": "Cifrado",
    "privacy.encryptionDescription":
      "Todos los datos se cifran tanto en tránsito (TLS 1.3) como en reposo (AES-256) utilizando protocolos de cifrado estándar de la industria.",
    "privacy.secureInfrastructure": "Infraestructura Segura",
    "privacy.secureInfrastructureDescription":
      "Nuestros servidores utilizan medidas de seguridad estándar de la industria; estamos avanzando hacia una infraestructura cubierta por BAA para cargas de trabajo HIPAA.",
    "privacy.accessControls": "Controles de Acceso",
    "privacy.accessControlsDescription":
      "Controles de acceso estrictos garantizan que solo el personal autorizado pueda acceder a tus datos, y todo acceso queda registrado.",
    "privacy.yourRightsAndChoices": "Tus Derechos y Opciones",
    "privacy.yourRightsAndChoicesDescription":
      "De conformidad con HIPAA y las leyes estatales de privacidad, tienes derecho a:",
    "privacy.yourRightsAndChoicesItem1":
      "Acceso: Solicitar copias de tu información personal de salud",
    "privacy.yourRightsAndChoicesItem2":
      "Rectificación: Solicitar la corrección de datos inexactos o incompletos",
    "privacy.yourRightsAndChoicesItem3":
      "Eliminación: Solicitar la eliminación de tu información personal",
    "privacy.yourRightsAndChoicesItem4":
      "Portabilidad: Solicitar tus datos en un formato legible por máquina",
    "privacy.yourRightsAndChoicesItem5":
      "Restricción: Solicitar la limitación del tratamiento de tus datos",
    "privacy.yourRightsAndChoicesItem6":
      "Oposición: Oponerte a determinados tipos de tratamiento de datos",
    "privacy.yourRightsAndChoicesItem7":
      "Notificación de Incidentes: Ser notificado de cualquier violación de datos dentro de las 72 horas",
    "privacy.stateSpecificCompliance": "Cumplimiento Específico por Estado",
    "privacy.stateSpecificComplianceDescription":
      "Cumplimos con todas las leyes estatales de privacidad aplicables, incluidas, entre otras:",
    "privacy.stateSpecificComplianceItem1":
      "Ley de Privacidad del Consumidor de California (CCPA)",
    "privacy.stateSpecificComplianceItem2":
      "Ley de Derechos de Privacidad de California (CPRA)",
    "privacy.stateSpecificComplianceItem3":
      "Ley de Protección de Datos del Consumidor de Virginia (VCDPA)",
    "privacy.stateSpecificComplianceItem4":
      "Ley de Privacidad de Colorado (CPA)",
    "privacy.stateSpecificComplianceItem5":
      "Ley de Privacidad de Datos de Connecticut (CTDPA)",
    "privacy.stateSpecificComplianceItem6":
      "Ley de Privacidad del Consumidor de Utah (UCPA)",
    "privacy.stateSpecificComplianceItem7":
      "Ley de Privacidad de Información Genética de Illinois",
    "privacy.stateSpecificComplianceItem8":
      "Ley de Texas sobre Protección y Ejecución contra el Robo de Identidad",
    "privacy.dataSharingAndThirdParties": "Intercambio de Datos y Terceros",
    "privacy.dataSharingAndThirdPartiesDescription":
      "Nunca vendemos, alquilamos ni compartimos tu información personal de salud con terceros con fines de marketing. Tus datos son tuyos y solo tuyos.",
    "privacy.dataSharingAndThirdPartiesItem1":
      "Con tu consentimiento explícito y por escrito",
    "privacy.dataSharingAndThirdPartiesItem2":
      "Cuando lo exija la ley o un proceso legal",
    "privacy.dataSharingAndThirdPartiesItem3":
      "Para prevenir daños graves a ti o a otras personas",
    "privacy.dataSharingAndThirdPartiesItem4":
      "Para tratamiento médico de emergencia",
    "privacy.dataSharingAndThirdPartiesItem5":
      "Con proveedores de servicios que cumplan con HIPAA y que ayuden a prestar nuestros servicios",
    "privacy.contactInformation": "Información de Contacto",
    "privacy.contactInformationDescription":
      "Si tienes alguna pregunta sobre esta Política de Privacidad o deseas ejercer tus derechos, comunícate con nuestro Responsable de Privacidad:",
    "privacy.privacyOfficer": "Responsable de Privacidad",
    "privacy.privacyOfficerEmail":
      "Correo electrónico: privacy@tranquiloo-app.com",
    "privacy.privacyOfficerPhone": "Teléfono: +1-385-867-8804",
    "privacy.privacyOfficerResponseTime":
      "Tiempo de respuesta: Dentro de 5 días hábiles",
    "privacy.changesToThisPolicy": "Cambios en esta Política",
    "privacy.changesToThisPolicyDescription":
      "Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos sobre cualquier cambio sustancial por correo electrónico y mediante la publicación de la política actualizada en nuestro sitio web. El uso continuado de nuestros servicios después de dichas modificaciones constituye tu aceptación de la Política de Privacidad actualizada.",
    "termsOfService.backToSettings": "Volver a Configuración",
    "chatHistorySidebar.newChat": "Nuevo chat",
    "treatmentCreation.createNewGoal": "Crear Nuevo Objetivo",
    "treatmentCreation.goalTitle": "Título del Objetivo",
    "goalForm.goalTitle": "Título de la meta",
    "goalForm.placeholder": "ej: práctica diaria de meditación",
    "goalForm.editGoal": "Editar meta",
    "goalForm.createNewGoal": "Crear nueva meta",
    "goalForm.description": "Descripción (Opcional)",
    "goalForm.placeholderDescription": "Describe tu meta con más detalle",
    "goalForm.category": "Categoría",
    "goalForm.selectCategory": "Selecciona una categoría",
    "goalForm.frequency": "Frecuencia",
    "goalForm.howOften": "¿Con qué frecuencia?",
    "goalForm.targetValue": "Valor objetivo (Opcional)",
    "goalForm.placeholderTargetValue": "ej: 10",
    "goalForm.unit": "Unidad (Opcional)",
    "goalForm.placeholderUnit": "ej: minutos",
    "goalForm.startDate": "Fecha de inicio",
    "goalForm.endDate": "Fecha de fin (Opcional)",
    "goalForm.updateGoal": "Actualizar meta",
    "goalForm.createGoal": "Crear meta",
    "goalForm.cancel": "Cancelar",
    //
    "goalForm.selfCare": "Autocuidado",
    "goalForm.therapy": "Terapia",
    "goalForm.mindfulness": "Mindfulness",
    "goalForm.exercise": "Ejercicio",
    "goalForm.social": "Social",
    "goalForm.work": "Trabajo",
    "goalForm.sleep": "Sueño",
    "goalForm.nutrition": "Nutrición",
    "goalForm.daily": "Diario",
    "goalForm.weekly": "Semanal",
    "goalForm.monthly": "Mensual",
  },
};

export const createTranslator = (language: Language) => {
  return (key: string, fallback?: string) => {
    const value = translationMap[language]?.[key];
    if (value) return value;
    const defaultVal = translationMap.en[key];
    return defaultVal || fallback || key;
  };
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("app_language") as Language | null;
    if (saved === "en" || saved === "es") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = useMemo(() => {
    return (key: string, fallback?: string) => {
      const value = translationMap[language]?.[key];
      if (value) return value;
      const defaultVal = translationMap.en[key];
      return defaultVal || fallback || key;
    };
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
};
