# Firebase Setup Instructions

## Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Create a Firebase project at https://console.firebase.google.com/
3. Get an OpenAI API key from https://platform.openai.com/api-keys

## Setup Steps

### 1. Initialize Firebase
```bash
firebase login
firebase init
```

Select:
- Functions: Configure a Cloud Functions project
- Firestore: Configure security rules and indexes files
- Hosting: Configure files for Firebase Hosting

### 2. Configure OpenAI API Key
```bash
firebase functions:config:set openai.key="your-openai-api-key-here"
```

### 3. Install Dependencies
```bash
cd functions
npm install
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

### 5. Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore
```

### 6. Build and Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

## Function Endpoints

### Generate Quote
- **URL**: `https://your-region-your-project.cloudfunctions.net/generateQuote`
- **Method**: POST
- **Body**:
```json
{
  "companyName": "Example Corp",
  "projectDescription": "Build a web application for inventory management",
  "hourlyRate": 120
}
```

### Health Check
- **URL**: `https://your-region-your-project.cloudfunctions.net/healthCheck`
- **Method**: GET

## Frontend Integration

Update your `src/services/aiService.ts` to use the Firebase function:

```typescript
const FIREBASE_FUNCTION_URL = 'https://your-region-your-project.cloudfunctions.net/generateQuote';

export const generateQuote = async (request: QuoteGenerationRequest): Promise<QuoteGenerationResponse> => {
  const response = await fetch(FIREBASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate quote');
  }

  const result = await response.json();
  return result.data;
};
```

## Security Notes
- The function includes CORS support for cross-origin requests
- Firestore rules ensure users can only access their own data
- OpenAI API key is stored securely in Firebase Functions config
- All requests are validated before processing

## Testing Locally
```bash
# Start Firebase emulators
firebase emulators:start

# Your function will be available at:
# http://localhost:5001/your-project/us-central1/generateQuote
```