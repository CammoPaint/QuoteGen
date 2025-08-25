# User Fields Migration Script

This script migrates user field names in the Firebase database to make them clearer and more descriptive.

## Field Changes

### Leads Collection
- `assignedTo` → `assignedToUserId`
- `userId` → `createdByUserId`  
- `userName` → `createdByUserName`
- `assignedToId` → `assignedToUserId`
- `assignedToName` → `assignedToUserName`

### Customers Collection
- `assignedTo` → `assignedToUserId`
- `userId` → `createdByUserId`
- `userName` → `createdByUserName`

### Tasks Collection
- `assignedTo` → `assignedToUserId`
- `assignedToId` → `assignedToUserId`

### Sales Tasks Collection
- `assignedTo` → `assignedToUserId`
- `assignedToId` → `assignedToUserId`
- `assignedToName` → `assignedToUserName`

## Before Running the Migration

1. **Backup your database** - This is critical as the migration will modify existing data
2. **Set up environment variables** - Make sure your `.env` file has the Firebase configuration
3. **Firebase Authentication** - The migration scripts need admin access to your Firebase project:
   - Option 1: Run with Firebase Admin SDK (requires service account key)
   - Option 2: Temporarily update Firestore Security Rules to allow read/write access
   - Option 3: Run from Firebase Functions with admin privileges
4. **Install dependencies** - Run `npm install` to ensure `tsx` is available

## Environment Variables Required

Create a `.env` file in the project root with:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Running the Migration

1. Install tsx if not already installed:
   ```bash
   npm install tsx --save-dev
   ```

2. Run the migration:
   ```bash
   npm run migrate:user-fields
   ```

3. Monitor the output for any errors or issues

## What the Migration Does

1. **Reads all documents** from leads, customers, tasks, and salesTasks collections
2. **Creates new fields** with the updated names
3. **Sets old fields to null** to mark them for deletion (you can clean these up later)
4. **Uses batch operations** for efficiency (500 operations per batch)
5. **Provides detailed logging** and error reporting

## Post-Migration Steps

1. **Test your application** to ensure everything works with the new field names
2. **Update your code** to use the new field names everywhere
3. **Clean up old fields** by running a second script to remove null fields (optional)
4. **Update any external integrations** that might reference the old field names

## Rollback Plan

If you need to rollback:

1. **Restore from backup** (recommended approach)
2. **Or create a reverse migration script** that maps the new fields back to old ones

## Migration Safety Features

- Uses Firebase batch operations for atomicity within batches
- Comprehensive error logging
- Does not delete old fields immediately (sets to null instead)
- Provides detailed statistics on migration progress
- Concurrent migration of different collections for speed

## Troubleshooting

If the migration fails:

1. Check the error logs in the console output
2. Ensure Firebase configuration is correct
3. Verify database permissions
4. Check network connectivity
5. Monitor Firebase quotas and limits
