/**
 * Simple Firebase connection test
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Simple .env file parser
function loadEnvFile(): void {
  try {
    const envPath = join(process.cwd(), '.env');
    const envFile = readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.warn('Could not load .env file:', error);
  }
}

loadEnvFile();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔧 Testing Firebase connection...');
console.log('📍 Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  try {
    console.log('🧪 Testing with a simple query on leads collection...');
    const leadsRef = collection(db, 'leads');
    const q = query(leadsRef, limit(1));
    const snapshot = await getDocs(q);
    
    console.log('✅ Successfully connected to Firebase');
    console.log(`📊 Found ${snapshot.size} document(s) in leads collection`);
    
    if (snapshot.size > 0) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      console.log('🔍 Sample document fields:', Object.keys(data));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    process.exit(1);
  }
}

// Set timeout
setTimeout(() => {
  console.error('❌ Connection test timed out');
  process.exit(1);
}, 15000);

testConnection();
