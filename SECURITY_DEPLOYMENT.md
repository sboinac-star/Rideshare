# 🚨 Security Deployment Guide

## Pre-Deployment Checklist

### 1. Firebase Security Rules
Deploy the Firestore security rules to protect your database:

```bash
firebase deploy --only firestore:rules
```

If you do not have `firebase-tools` installed yet:

```bash
npm install -g firebase-tools
firebase login
```

Then set your Firebase project ID in `.firebaserc` and run:

```bash
firebase use --add
firebase deploy --only firestore:rules
```

**Critical**: Without these rules, anyone can read/write your entire database!

### 2. Firebase Configuration Files
Create the following files at the project root if they are not already present:

- `firebase.json`
- `.firebaserc`

A minimal `firebase.json` is included in this repo and points to `firestore.rules`.

### 3. Environment Variables
- ✅ Copy `.env.local.example` to `.env.local`
- ✅ Fill in ALL Firebase configuration values
- ✅ Use production Firebase project (separate from development)
- ✅ Set `NODE_ENV=production`
- ✅ Set `NEXT_PUBLIC_APP_URL` to your actual domain

### 3. Firebase App Check (Recommended)
Enable Firebase App Check to prevent abuse:

1. Go to Firebase Console → App Check
2. Enable for Web apps
3. Add reCAPTCHA v3 or custom provider
4. Update your Firebase config

### 4. Domain & HTTPS
- ✅ Deploy to a custom domain (not firebase.app subdomain)
- ✅ Enable HTTPS (Netlify does this automatically)
- ✅ Add domain to Firebase authorized domains

### 5. CORS Configuration
Update the CORS headers in `src/lib/validation.ts`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://your-actual-domain.com'  // ← Change this!
    : 'http://localhost:3000',
  // ... rest of headers
};
```

## Security Features Implemented

### ✅ Database Security
- **Firestore Rules**: Only authenticated users can write, public read for journeys
- **Data Validation**: All inputs validated server-side
- **Owner Checks**: Users can only modify their own data

### ✅ API Security
- **Rate Limiting**: Prevents abuse (10-200 requests per 15min per IP)
- **Input Validation**: Email, phone, string length validation
- **CORS Protection**: Only allowed origins can access APIs
- **Error Handling**: No sensitive data leaked in errors

### ✅ Application Security
- **Security Headers**: XSS protection, clickjacking prevention
- **Content Sanitization**: HTML injection prevention
- **No Sensitive Data Exposure**: API keys properly configured

### ✅ Network Security
- **HTTPS Enforcement**: Automatic on Netlify
- **Secure Cookies**: When authentication is added
- **CSP Headers**: Basic content security policy

## Monitoring & Maintenance

### Regular Tasks
1. **Monitor Firebase Usage**: Check for unusual activity
2. **Rotate API Keys**: Every 90 days
3. **Update Dependencies**: Weekly security updates
4. **Review Logs**: Check for failed authentication attempts

### Incident Response
1. **Unusual Activity**: Check Firebase logs
2. **Security Breach**: Immediately rotate all API keys
3. **Data Exposure**: Notify affected users, comply with regulations

## Additional Security (Optional)

### Authentication (Recommended)
Add Firebase Authentication for user accounts:
- Email/password authentication
- Phone number verification
- Social login options

### Advanced Security
- **Firebase App Check**: Prevent unauthorized app access
- **Cloud Functions**: Move sensitive logic server-side
- **VPC**: Isolate database traffic
- **WAF**: Web application firewall

## Emergency Contacts
- Firebase Support: https://firebase.google.com/support
- Netlify Support: https://netlify.com/support
- Security Issues: Report to your security team immediately

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures!