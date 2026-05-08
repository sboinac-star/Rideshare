# NWA Ride Share - Complete Setup Guide

## Project Overview
A full-stack rideshare application for Northwest Arkansas with local and intercity ride services, featuring real-time tracking, payments, and driver management.

## Tech Stack
- **Frontend**: Next.js 16 with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging
- **Hosting**: Netlify

## Prerequisites
- Node.js 20+ and npm
- Firebase project account (https://firebase.google.com)
- Stripe account (https://stripe.com)
- Google Maps API key
- Netlify account (https://netlify.com)

## 1. Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "nwa-rideshare"
3. Enable Firestore Database
4. Enable Authentication (Email/Password, Google)
5. Enable Storage for driver documents

### Get Firebase Credentials
1. Go to Project Settings → General
2. Scroll to "Your apps" and create a Web app
3. Copy the Firebase config values

### Enable Firebase Messaging (Push Notifications)
1. Go to Cloud Messaging tab
2. Generate Web credentials
3. Copy the VAPID key

## 2. Environment Variables Setup

Create `.env.local` in the project root with:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

## 3. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Go to Developers → API Keys
3. Copy your Public Key and Secret Key

### Create Products
1. In Stripe Dashboard, create products for different ride types:
   - Local Ride
   - Intercity Ride

## 4. Google Maps API Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create an API key
4. Add restrictions (Website, your domain)

## 5. Local Development

### Install Dependencies
```bash
npm install
```

### Update Firebase Config
Edit `public/firebase-messaging-sw.js` and replace the Firebase config values

### Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 6. Firestore Database Setup

### Create Collections

#### 1. `users` collection
```javascript
{
  userId: string,
  email: string,
  phone: string,
  name: string,
  profileImage: string,
  createdAt: timestamp,
  totalRides: number,
  averageRating: number,
  paymentMethod: object
}
```

#### 2. `drivers` collection
```javascript
{
  userId: string,
  name: string,
  email: string,
  phone: string,
  licenseNumber: string,
  vehicleMake: string,
  vehicleModel: string,
  licensePlate: string,
  insuranceExpiry: timestamp,
  status: "pending" | "active" | "inactive",
  rating: number,
  completedRides: number,
  createdAt: timestamp
}
```

#### 3. `rides` collection
```javascript
{
  userId: string,
  pickup: string,
  dropoff: string,
  rideType: "local" | "intercity",
  date: timestamp,
  passengers: number,
  estimatedPrice: number,
  status: "requested" | "accepted" | "in_progress" | "completed" | "cancelled",
  acceptedDriver: string,
  createdAt: timestamp,
  completedAt: timestamp
}
```

## 7. Deploy to Netlify

### Option 1: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

### Option 2: Using GitHub Integration

1. Push your code to GitHub
2. Go to [Netlify App](https://app.netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Add environment variables (Settings → Build & Deploy → Environment)
8. Deploy

### Option 3: Manual Deployment

1. Run `npm run build`
2. Go to https://app.netlify.com
3. Drag and drop the `.next` folder

## 8. Add Environment Variables to Netlify

In Netlify Dashboard:
1. Go to Site Settings → Build & Deploy → Environment
2. Add all environment variables from `.env.local`
3. Make sure to include:
   - All NEXT_PUBLIC_* variables
   - STRIPE_SECRET_KEY

## 9. Features Implemented

### Passenger Features
- ✅ Book rides (local & intercity)
- ✅ Real-time price estimation
- ✅ View ride history
- ✅ Track active rides
- ✅ Rate drivers
- ✅ Secure payments with Stripe

### Driver Features
- ✅ Driver registration & verification
- ✅ Driver profile & ratings
- ✅ Vehicle information management
- ✅ Accept/reject rides
- ✅ Real-time ride tracking
- ✅ Earnings dashboard

### Admin Features (Coming Soon)
- Dashboard with analytics
- User management
- Driver verification
- Payment reports

## 10. Testing

### Test Ride Booking
1. Visit http://localhost:3000 (or your Netlify domain)
2. Fill in ride details
3. Click "Estimate Price"
4. Click "Request Ride"

### Test Driver Registration
1. Go to "Become a Driver"
2. Fill in all required information
3. Submit application

### Test Payments
1. Book a ride
2. Go to "My Rides"
3. Click "Pay Now" on pending rides
4. Use Stripe test card: 4242 4242 4242 4242

## 11. Domain & Custom Configuration

### Set Custom Domain
1. In Netlify: Site Settings → Domain Management
2. Add custom domain
3. Configure DNS settings with your registrar

### Enable HTTPS
Automatically handled by Netlify with Let's Encrypt

## 12. Monitoring & Logs

### Firebase Console
- Monitor Firestore usage
- Check authentication logs
- View storage usage

### Netlify Dashboard
- Check deployment logs
- Monitor function usage
- View analytics

### Stripe Dashboard
- Monitor payment activity
- Check for disputes
- Review customer data

## 13. Next Steps for Production

- [ ] Add Google/Facebook authentication
- [ ] Implement SMS notifications
- [ ] Add insurance & liability features
- [ ] Set up admin dashboard
- [ ] Implement surge pricing
- [ ] Add driver location updates
- [ ] Create mobile app (React Native)
- [ ] Add rideshare chat feature
- [ ] Implement referral program

## 14. Troubleshooting

### Firebase Connection Issues
- Verify API key in `.env.local`
- Check Firebase project is active
- Ensure Firestore is enabled

### Stripe Payment Errors
- Use correct test keys (pk_test_*, sk_test_*)
- Verify CORS settings in Netlify

### Map Not Showing
- Verify Google Maps API key
- Enable required APIs in Google Cloud
- Check API restrictions

## Support & Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

This project is provided as-is for educational and commercial use.
