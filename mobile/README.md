# NoVaFSM Mobile App

Offline-first React Native mobile application for field technicians built with Expo.

## Features

- ✅ Offline-first architecture with SQLite
- ✅ Background sync every 15 minutes
- ✅ Idempotency-key based conflict resolution
- ✅ View assigned jobs
- ✅ Check-in/check-out with location tracking
- ✅ Photo capture (camera/gallery)
- ✅ Signature capture
- ✅ Time entry tracking
- ✅ Deep link navigation to Google Maps/Apple Maps
- ✅ Real-time sync status

## Tech Stack

- **Framework**: Expo SDK 49+
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: Zustand
- **API Client**: Axios + TanStack Query
- **Local Database**: expo-sqlite
- **Offline Detection**: @react-native-community/netinfo
- **Background Tasks**: expo-background-fetch

## Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
```

**Note**: For iOS simulator, use `http://localhost:3000`. For Android emulator, use `http://10.0.2.2:3000`.

### 3. Start Development Server

```bash
npx expo start
```

Choose your platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
mobile/
├── App.tsx                 # Root component with navigation
├── app.json               # Expo configuration
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── JobsScreen.tsx
│   │   ├── JobDetailScreen.tsx
│   │   ├── MapScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/
│   │   ├── api.ts        # Axios API client
│   │   ├── database.ts   # SQLite setup and queries
│   │   └── sync.ts       # Offline sync logic
│   ├── hooks/
│   │   ├── use-auth.ts   # Authentication hook
│   │   ├── use-jobs.ts   # Jobs data hook
│   │   └── use-sync.ts   # Sync status hook
│   ├── store/
│   │   └── auth-store.ts # Zustand auth store
│   └── types/
│       └── index.ts      # TypeScript types
└── README.md
```

## Offline Sync Architecture

### SQLite Schema

**jobs** table:
- Stores all assigned jobs locally
- Fields: id, tenantId, number, status, customerId, customerName, title, description, scheduledStart, scheduledEnd, syncStatus, version, lastSyncedAt
- Synced from API every 15 minutes or on pull-to-refresh

**job_photos** table:
- Queues photos for upload
- Fields: id, jobId, uri, uploaded, uploadedUrl, createdAt
- Uploaded via presigned S3 URLs when online

**job_signatures** table:
- Stores customer signatures
- Fields: id, jobId, type, data (base64), uploaded, createdAt

**sync_queue** table:
- Queues mutations while offline
- Fields: id, operation (POST/PUT/PATCH), entity, entityId, data (JSON), idempotencyKey (UUID), attempts, createdAt
- Processed sequentially when connection restored

### Sync Flow

1. **Background Fetch** (every 15 minutes):
   - Check network connectivity (NetInfo)
   - If online: fetch latest jobs from API
   - Process sync_queue (pending mutations)
   - Upload queued photos and signatures

2. **Pull-to-Refresh**:
   - Trigger immediate sync
   - Show loading indicator

3. **Mutation Queue**:
   - User performs action (check-in, add photo, etc.)
   - Action saved to sync_queue with UUID idempotency key
   - If online: sync immediately
   - If offline: queue for later

4. **Conflict Resolution**:
   - API returns 409 with server state
   - Show conflict UI: "Server has newer version. Retry?"
   - User can retry or accept server version

### Idempotency

All mutations include `Idempotency-Key` header (UUID) to prevent duplicate processing if request is retried. Server maintains 24-hour cache of idempotency keys.

## Demo Credentials

Use the same credentials as the web app:

**Tenant 1 (Acme)**:
- Technician 1: `tech1@acme.ca` / `Password123!`
- Technician 2: `tech2@acme.ca` / `Password123!`

**Tenant 2 (Coastal)**:
- Technician: `tech1@coastal-services.com` / `Password123!`

## Features Implementation Status

### ✅ Implemented
- [x] Login with JWT authentication
- [x] View assigned jobs (from SQLite)
- [x] Job detail view
- [x] Offline data persistence
- [x] Sync status indicator
- [x] Pull-to-refresh sync
- [x] Basic navigation structure

### 🚧 Partially Implemented
- [ ] Photo capture (UI ready, needs expo-camera integration)
- [ ] Signature capture (UI ready, needs react-native-signature-canvas)
- [ ] Location tracking (UI ready, needs expo-location)
- [ ] Background sync (service ready, needs expo-background-fetch registration)

### ⏳ To Implement
- [ ] Map view with job markers (react-native-maps)
- [ ] Push notifications (expo-notifications + FCM)
- [ ] Time entry start/stop timer
- [ ] Inventory usage recording
- [ ] Expense entry with photo receipts
- [ ] Conflict resolution UI

## Building for Production

### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Or use Expo's classic build
expo build:ios
```

Requirements:
- Apple Developer account ($99/year)
- App Store Connect setup
- Push notification certificates

### Android

```bash
# Build for Google Play
eas build --platform android --profile production

# Or use Expo's classic build
expo build:android
```

Requirements:
- Google Play Developer account ($25 one-time)
- Keystore for signing (auto-generated by EAS)
- FCM configuration for push notifications

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests (Detox)

```bash
# iOS
npm run test:e2e:ios

# Android
npm run test:e2e:android
```

## Troubleshooting

### Cannot connect to API

- iOS Simulator: Use `http://localhost:3000`
- Android Emulator: Use `http://10.0.2.2:3000`
- Physical Device: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Ensure backend is running and accessible

### SQLite errors

- Clear app data: Shake device → "Delete app data and reload"
- Or: `expo start --clear`

### Sync not working

- Check network connectivity (airplane mode off)
- Verify API URL in .env
- Check backend logs for errors
- Inspect sync_queue table in SQLite

### Photos not uploading

- Grant camera/gallery permissions in device settings
- Check S3/MinIO configuration in backend
- Verify presigned URL generation

## Performance Optimization

- **Image Optimization**: Compress photos before upload (use expo-image-manipulator)
- **Pagination**: Load jobs in batches (20 at a time)
- **Debouncing**: Debounce search inputs (300ms)
- **Lazy Loading**: Load job details on demand
- **Cache**: Use TanStack Query cache (5min stale time)

## Security

- Tokens stored in expo-secure-store (encrypted keychain)
- No sensitive data in logs
- HTTPS only in production
- Certificate pinning for API requests (optional)

## Monitoring

- Sentry integration for crash reporting
- Analytics with Expo Analytics or Firebase
- Performance monitoring with React Native Performance

## License

Proprietary - All Rights Reserved
