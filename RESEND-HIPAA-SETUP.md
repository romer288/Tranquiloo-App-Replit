# Resend HIPAA-Compliant Email Setup Guide

## Why Resend?

✅ **HIPAA-Compliant** - Signs Business Associate Agreement (BAA)
✅ **Affordable** - $20/month (vs SendGrid which is NOT HIPAA-compliant)
✅ **Modern API** - Simpler than SendGrid
✅ **Great Deliverability** - Used by many healthcare startups
✅ **Developer-Friendly** - Easy integration

---

## Step 1: Sign Up for Resend

1. Go to https://resend.com/signup
2. Create your account
3. Verify your email address

---

## Step 2: Upgrade to Pro Plan ($20/month)

1. Go to https://resend.com/settings/billing
2. Click "Upgrade to Pro"
3. Enter payment information
4. Confirm upgrade

**Pro Plan includes:**
- 50,000 emails/month
- Custom domains
- **HIPAA BAA eligibility**
- Priority support

---

## Step 3: Request Business Associate Agreement (BAA)

**CRITICAL FOR HIPAA COMPLIANCE**

1. Email Resend support: support@resend.com
2. Subject: "Request for BAA (Business Associate Agreement) - HIPAA Compliance"
3. Email body:

```
Hello Resend Team,

I am using Resend for a mental health application (Tranquiloo) that handles Protected Health Information (PHI) under HIPAA.

I am currently on the Pro plan and would like to request a Business Associate Agreement (BAA) to ensure HIPAA compliance for our email communications.

Company: [Your Company Name]
Account Email: [Your email]
Use Case: Mental health therapy application - patient verification emails and notifications

Please let me know the process for executing the BAA.

Thank you!
[Your Name]
```

4. Wait for Resend to send you the BAA document (usually 1-2 business days)
5. **Review and sign the BAA**
6. Keep a copy for your records

---

## Step 4: Verify Your Domain

**Required before sending emails**

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain: `tranquiloo-app.com`
4. Resend will provide DNS records to add:

### DNS Records to Add (in your domain registrar):

**TXT Record:**
```
Name: _resend
Value: [Resend will provide this]
```

**MX Records** (optional but recommended):
```
Priority 10: feedback-smtp.us-east-1.amazonses.com
```

**DKIM Records:**
```
Name: resend._domainkey
Value: [Resend will provide this]
```

5. Wait for DNS propagation (can take up to 48 hours, usually 15 minutes)
6. Click "Verify Domain" in Resend dashboard

---

## Step 5: Create API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "Tranquiloo Production"
4. Permissions: "Sending access" (Full access)
5. Click "Add"
6. **Copy the API key immediately** (starts with `re_`)
7. The key will look like: `re_123abc456def789ghi`

---

## Step 6: Add API Key to Your App

### Local Development (.env file)

Edit `/Users/bernardromero/Tranquiloo-App-Replit/.env`:

```bash
# Remove or comment out SendGrid
# SENDGRID_API_KEY=...

# Add Resend API key
RESEND_API_KEY=re_your_actual_api_key_here
```

### Vercel Deployment (Production)

1. Go to https://vercel.com/bernardromero/tranquiloo-app-replit/settings/environment-variables
2. Add new environment variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: `re_your_actual_api_key_here`
   - **Environments**: Production, Preview, Development
3. Click "Save"
4. Redeploy your app

---

## Step 7: Configure Sender Address

### Option A: Use Your Verified Domain

Update [server/emailService.ts:113](server/emailService.ts#L113):

```typescript
from: 'noreply@tranquiloo-app.com'  // Or any email @your-domain.com
```

### Option B: Use Resend's Test Domain (Development Only)

For testing only (NOT for production):

```typescript
from: 'onboarding@resend.dev'
```

**Note**: For production with HIPAA compliance, you MUST use your own verified domain.

---

## Step 8: Test Email Sending

Run this command to test emails:

```bash
npm run dev
```

Then trigger a verification email by creating a new account. Check logs for:

```
✅ Resend API key configured successfully (HIPAA-compliant)
✅ Email sent successfully via Resend (HIPAA-compliant) to: test@example.com
   Email ID: abc123
```

---

## Step 9: Verify HIPAA Compliance Checklist

Before going live with real patient data:

- [ ] Resend Pro plan active ($20/month)
- [ ] BAA signed and executed with Resend
- [ ] Domain verified (tranquiloo-app.com)
- [ ] API key configured in production (Vercel)
- [ ] Sender address uses verified domain (not @resend.dev)
- [ ] Test emails working successfully
- [ ] BAA stored securely for compliance audits

---

## Resend API Key Format

- **Correct**: `re_123abc456def789ghi`
- **Starts with**: `re_`
- **Length**: ~30-40 characters

If your key doesn't start with `re_`, it's incorrect.

---

## Email Limits

**Resend Pro Plan ($20/month):**
- 50,000 emails/month
- ~1,667 emails/day
- More than enough for beta testing

**If you exceed limits:**
- Upgrade to Business plan ($400/month for 1M emails)
- Or implement email batching

---

## Troubleshooting

### Error: "API key not found"

**Solution**: Check that `RESEND_API_KEY` is set in `.env` and Vercel environment variables.

### Error: "Domain not verified"

**Solution**:
1. Go to https://resend.com/domains
2. Check DNS records are correct
3. Wait for DNS propagation (can take up to 48 hours)
4. Click "Verify Domain"

### Error: "From address not verified"

**Solution**: Make sure the "from" email address uses your verified domain:
- ✅ `noreply@tranquiloo-app.com`
- ❌ `noreply@gmail.com`

### Emails going to spam

**Solutions**:
1. Add SPF record to DNS
2. Add DKIM record (Resend provides this)
3. Add DMARC record
4. Use a professional "from" address
5. Avoid spam trigger words in subject lines

---

## Cost Breakdown

**Resend HIPAA-Compliant Setup:**
- Pro Plan: $20/month
- Domain verification: Free
- BAA: Free (included with Pro plan)
- API usage: Included up to 50,000 emails/month

**Total**: **$20/month**

Compare to:
- SendGrid: NOT HIPAA-compliant (never offers BAA)
- Paubox: $29-69/month
- Google Workspace Business Plus: $18/month (but requires additional setup)

---

## Next Steps After Resend Setup

1. ✅ Resend configured and BAA signed
2. ⏳ Delete existing 14 PHI records from database
3. ⏳ Add email validation to reject real email domains (beta testing only)
4. ⏳ Build and deploy mobile apps to App Store / Play Store
5. ⏳ Start beta testing with test accounts only
6. ⏳ January 2026: Upgrade to full HIPAA infrastructure (Supabase Team + HIPAA)

---

## Support

**Resend Support:**
- Email: support@resend.com
- Docs: https://resend.com/docs
- Status: https://status.resend.com

**BAA Questions:**
- Email Resend support specifically about HIPAA/BAA
- Reference your Pro plan subscription
- Allow 1-2 business days for response

---

## Important Notes

1. **BAA is REQUIRED for HIPAA compliance** - Don't send real patient emails without it
2. **Use verified domain** - Not @resend.dev or @gmail.com for production
3. **Keep BAA on file** - Required for HIPAA audits
4. **Test thoroughly** - Verify emails are being received before going live
5. **Monitor deliverability** - Check Resend dashboard for bounce rates

---

## Current Status

✅ Resend library installed (`npm install resend`)
✅ EmailService updated to use Resend
✅ SendGrid removed
✅ Signed up for Resend
✅ Upgraded to Pro plan ($20/month)
✅ API key added to Vercel (`re_wcXuihD6_KgujZDKU4guDSPtbxU6o4o4B`)
✅ Domain verified (tranquiloo-app.com)
✅ DNS records configured in Squarespace
✅ Email "from" address updated to noreply@tranquiloo-app.com

⏳ Next steps:
  1. **Request BAA from Resend** (Critical for HIPAA compliance!)
  2. Test email sending functionality
  3. Once BAA is signed, your email system will be fully HIPAA-compliant!
