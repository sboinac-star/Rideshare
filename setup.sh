#!/bin/bash

# NWA Ride Share - Quick Setup Script

echo "================================"
echo "NWA Ride Share - Setup Wizard"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local file already exists"
else
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local 2>/dev/null || {
        echo "Creating new .env.local file..."
        cat > .env.local << 'EOF'
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
EOF
    }
    echo "✅ .env.local created. Please fill in your credentials."
fi

echo ""
echo "📋 Setup Checklist:"
echo "================================"
echo ""
echo "1. Firebase Setup:"
echo "   - Create Firebase project: https://console.firebase.google.com"
echo "   - Enable Firestore Database"
echo "   - Enable Authentication"
echo "   - Enable Storage"
echo "   - Add Web app and copy config to .env.local"
echo ""
echo "2. Stripe Setup:"
echo "   - Create Stripe account: https://stripe.com"
echo "   - Go to Developers → API Keys"
echo "   - Copy keys to .env.local"
echo ""
echo "3. Google Maps Setup:"
echo "   - Create project: https://console.cloud.google.com"
echo "   - Enable Maps JavaScript API"
echo "   - Create API key and add to .env.local"
echo ""
echo "4. Netlify Setup:"
echo "   - Create account: https://netlify.com"
echo "   - Connect your GitHub repository"
echo "   - Set up environment variables"
echo ""
echo "================================"
echo ""
echo "After filling in .env.local, run:"
echo "  npm run dev"
echo ""
echo "To deploy to Netlify:"
echo "  netlify deploy --prod"
echo ""
echo "For detailed setup instructions, see SETUP_GUIDE.md"
