# NWA Ride Share 🚗

A full-stack rideshare web application for Northwest Arkansas with local and intercity ride services. Built with Next.js, Firebase, Stripe, and deployed on Netlify.

## � Security First

This application implements comprehensive security measures:

- **Database Security**: Firebase Security Rules protect all data
- **API Security**: Rate limiting, input validation, and CORS protection
- **Authentication**: Secure user authentication with Firebase Auth
- **Data Protection**: Input sanitization and validation
- **Network Security**: HTTPS enforcement and security headers

> ⚠️ **Important**: Before deploying, read `SECURITY_DEPLOYMENT.md` for critical security setup instructions.

## �🚀 Features

### For Passengers
- **Easy Booking**: Simple interface to book local or intercity rides
- **Price Estimation**: Real-time price estimates before booking
- **Real-time Tracking**: Live tracking of your driver's location
- **Payment Options**: Secure Stripe payment integration
- **Ride History**: View all past and upcoming rides
- **Driver Ratings**: Rate and review drivers
- **Safety Features**: Emergency SOS, location sharing, ride recording

### For Drivers
- **Simple Registration**: Quick and easy driver signup process
- **Income Tracking**: Monitor earnings and completed rides
- **Rating System**: Build your reputation with passenger ratings
- **Vehicle Management**: Store and manage vehicle information
- **Flexible Scheduling**: Work on your own schedule
- **Dashboard**: View available rides and trip details

### Technical Features
- 🔐 Firebase Authentication (Email/Password, Google)
- 📱 Responsive Design with Tailwind CSS
- 💳 Stripe Payment Processing
- 🗺️ Google Maps Integration
- 🔔 Push Notifications (Firebase Cloud Messaging)
- 🌐 Real-time Database (Firestore)
- ⚡ Optimized Performance (Turbopack)
- 🔄 Service Workers for offline support

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Firebase account
- Stripe account
- Google Maps API key
- Netlify account (for deployment)

## 🛠️ Installation

### 1. Project Location
```bash
cd /Users/bsrao/nwa-rideshare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with:
- Firebase credentials
- Stripe API keys
- Google Maps API key

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

## 📁 Project Structure

```
nwa-rideshare/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home - Ride booking
│   │   ├── rides/page.tsx          # Ride history & payments
│   │   ├── driver/page.tsx         # Active ride tracking
│   │   ├── driver-register/page.tsx # Driver registration
│   │   ├── api/
│   │   │   ├── rides/route.ts      # Ride API endpoints
│   │   │   ├── drivers/route.ts    # Driver API endpoints
│   │   │   └── payment/route.ts    # Payment processing
│   │   ├── layout.tsx              # Root layout with navigation
│   │   └── globals.css             # Global styles
│   └── lib/
│       ├── firebase.ts             # Firebase configuration
│       └── notifications.ts        # Push notification utilities
├── public/
│   └── firebase-messaging-sw.js    # Service worker
├── netlify.toml                     # Netlify configuration
├── next.config.ts                   # Next.js configuration
├── SETUP_GUIDE.md                   # Detailed setup instructions
└── package.json                     # Dependencies
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore, Authentication, and Storage
3. Copy your config to `.env.local`
4. See SETUP_GUIDE.md for detailed steps

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from Developers section
3. Add keys to `.env.local`

### Google Maps Setup
1. Create a project at https://console.cloud.google.com
2. Enable Maps JavaScript API
3. Create an API key and add to `.env.local`

## 📚 API Endpoints

### Rides
- `POST /api/rides` - Create new ride request
- `GET /api/rides?userId=USER_ID` - Get user's rides

### Drivers
- `POST /api/drivers` - Register as driver
- `GET /api/drivers?userId=USER_ID` - Get driver profile
- `PATCH /api/drivers` - Update driver status/rating

### Payments
- `POST /api/payment` - Create payment intent
- `GET /api/payment?intentId=INTENT_ID` - Get payment status

## 🚀 Deployment

### Deploy to Netlify

#### Option 1: Using Netlify CLI
```bash
npm run build
netlify deploy --prod
```

#### Option 2: GitHub Integration
1. Push to GitHub
2. Connect to Netlify via app.netlify.com
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables in Netlify dashboard

#### Option 3: Drag & Drop
```bash
npm run build
```
Then drag the `.next` folder to https://app.netlify.com

### Environment Variables in Netlify
Add these in Site Settings → Build & Deploy → Environment:
- All `NEXT_PUBLIC_*` variables
- `STRIPE_SECRET_KEY`
- Other API keys

## 📊 Database Schema

### Users Collection
```javascript
{
  userId: string,
  email: string,
  phone: string,
  name: string,
  totalRides: number,
  averageRating: number,
  createdAt: timestamp
}
```

### Drivers Collection
```javascript
{
  userId: string,
  name: string,
  licenseNumber: string,
  vehicleMake: string,
  vehicleModel: string,
  licensePlate: string,
  status: "pending" | "active" | "inactive",
  rating: number,
  completedRides: number
}
```

### Rides Collection
```javascript
{
  userId: string,
  pickup: string,
  dropoff: string,
  rideType: "local" | "intercity",
  date: timestamp,
  passengers: number,
  estimatedPrice: number,
  status: "requested" | "accepted" | "in_progress" | "completed",
  acceptedDriver: string
}
```

## 🧪 Testing

### Test Ride Booking
1. Visit homepage
2. Select ride type (Local/Intercity)
3. Enter locations and date
4. Click "Estimate Price"
5. Click "Request Ride"

### Test Driver Registration
1. Click "Become a Driver"
2. Fill driver details
3. Submit application

### Test Payments
1. Go to My Rides
2. Click "Pay Now" on pending rides
3. Use test card: 4242 4242 4242 4242
4. Any future expiry and 3-digit CVC

## 🔒 Security Considerations

- ✅ Environment variables for secrets
- ✅ Firebase security rules configured
- ✅ HTTPS enforced on Netlify
- ✅ Stripe PCI compliance
- ✅ CORS properly configured
- ✅ Input validation on API routes
- ⚠️ TODO: Rate limiting on endpoints
- ⚠️ TODO: Enhanced driver verification
- ⚠️ TODO: Incident reporting system

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time ride matching algorithm
- [ ] Surge pricing
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Video verification for drivers
- [ ] Insurance & liability features
- [ ] Referral program
- [ ] Corporate accounts

## 🤝 Contributing

This project is currently a prototype. For production use, consider:
- Adding comprehensive error handling
- Implementing logging & monitoring
- Adding automated testing
- Setting up CI/CD pipeline
- Implementing rate limiting
- Adding analytics

## 📞 Support

For setup help, see SETUP_GUIDE.md

## 📄 License

MIT License - Free to use and modify

## 🎉 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Run locally
npm run dev

# 4. Deploy to Netlify
npm run build
netlify deploy --prod
```

---

Built with ❤️ for Northwest Arkansas rideshare community
