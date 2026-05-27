# LifeVault Setup Guide

## Prerequisites

- **Node.js** v18+ and npm v9+
- **Git**
- **Firebase Account** (for authentication & storage)
- **Google Play Developer Account** (for publishing)
- **Windows Developer Account** (for Microsoft Store)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Gitmandy1/Ap-mania.git
cd Ap-mania
```

### 2. Install Dependencies
```bash
npm run install-all
```

This installs:
- Root dependencies
- Backend dependencies
- Mobile dependencies

---

## Backend Setup (Node.js + Express)

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Create `.env` File
```bash
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `backend/.env`:
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string
# OR use Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_PATH=./firebase-admin-sdk.json

# Email Service (for legacy letter delivery)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@lifevault.app

# File Storage
AWS_S3_BUCKET=your_s3_bucket_name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 4. Start Backend Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## Mobile Setup (React Native)

### 1. Navigate to Mobile
```bash
cd mobile
```

### 2. Create Firebase Config
Create `src/config/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### 3. Install Expo CLI
```bash
npm install -g expo-cli
```

### 4. Start Mobile App
```bash
expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan QR code with Expo Go app.

---

## Firebase Setup (Recommended)

### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Click "Create Project"
- Name it "LifeVault"
- Enable Google Analytics

### 2. Enable Authentication
- Go to Authentication → Sign-in method
- Enable Email/Password
- Enable Google Sign-in

### 3. Create Firestore Database
- Go to Firestore Database
- Create database in production mode
- Set rules (see SECURITY.md)

### 4. Setup Cloud Storage
- Go to Storage
- Create bucket for document uploads
- Configure CORS for mobile app

### 5. Download Admin SDK
- Go to Project Settings → Service Accounts
- Generate private key JSON
- Save as `firebase-admin-sdk.json` in backend directory

---

## Database Schema (Firestore)

```
users/
├── {userId}
│   ├── email: string
│   ├── familyMembers: array
│   ├── createdAt: timestamp
│   └── subscriptionStatus: string (free/premium)
│
vault/
├── {vaultId}
│   ├── userId: string
│   ├── familyMember: object
│   │   ├── name: string
│   │   ├── ssn: encrypted_string
│   │   ├── dob: date
│   │   └── documents: array
│   └── createdAt: timestamp
│
legacy/
├── {legacyId}
│   ├── userId: string
│   ├── executor: object
│   ├── assetDistribution: object
│   ├── letters: array
│   │   ├── recipientEmail: string
│   │   ├── letterContent: string
│   │   └── autoSendOnDeath: boolean
│   └── createdAt: timestamp
```

---

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Mobile Tests
```bash
cd mobile
npm test
```

---

## Deployment

### Backend (Heroku / Railway / AWS)
See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

### Mobile (App Stores)
See [docs/APP_STORE_DEPLOYMENT.md](./APP_STORE_DEPLOYMENT.md)

---

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Set strong encryption keys
- [ ] Configure Firebase security rules
- [ ] Enable MFA for admin accounts
- [ ] Regular security audits
- [ ] GDPR compliance review
- [ ] HIPAA compliance (if medical records)

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Firebase Connection Issues
- Verify `.env` variables
- Check Firebase project is active
- Ensure Service Account JSON is valid

### React Native Build Issues
```bash
# Clear cache
expo cache clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Support & Questions

Create an issue on GitHub: [Gitmandy1/Ap-mania/issues](https://github.com/Gitmandy1/Ap-mania/issues)

---

**Last Updated**: May 2026
