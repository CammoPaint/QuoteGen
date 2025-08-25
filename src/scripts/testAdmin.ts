/**
 * Simple test to check Firebase Admin SDK setup
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Testing Firebase Admin SDK setup...\n');

// Load environment
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

async function testAdminSetup() {
  try {
    console.log('📍 Project ID from env:', process.env.VITE_FIREBASE_PROJECT_ID);
    
    // Check for service account files
    const commonPaths = [
      join(process.cwd(), 'firebase-service-account.json'),
      join(process.cwd(), 'serviceAccountKey.json'),
      join(process.cwd(), 'firebase-adminsdk.json')
    ];
    
    let foundServiceAccount = false;
    for (const path of commonPaths) {
      try {
        const content = readFileSync(path, 'utf8');
        const parsed = JSON.parse(content);
        console.log('🔑 Found service account key:', path);
        console.log('   Project ID in key:', parsed.project_id);
        foundServiceAccount = true;
        break;
      } catch {
        // File doesn't exist or invalid JSON
      }
    }
    
    if (!foundServiceAccount) {
      console.log('⚠️  No service account key found in project root');
      console.log('   Looking for: firebase-service-account.json, serviceAccountKey.json, or firebase-adminsdk.json');
      console.log('\n💡 To get your service account key:');
      console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
      console.log('   2. Click "Generate New Private Key"');
      console.log('   3. Save the downloaded file as "firebase-service-account.json" in project root');
      console.log('\n🔄 Trying with default credentials anyway...');
    }
    
    // Try to initialize
    if (getApps().length === 0) {
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
    }

    const db = getFirestore();
    
    // Try a simple operation
    console.log('\n🧪 Testing database access...');
    
    const collections = ['customers', 'tasks', 'salesTasks']; // customers includes both customers and leads
    let totalDocs = 0;
    
    for (const collectionName of collections) {
      try {
        const testCollection = db.collection(collectionName);
        const snapshot = await testCollection.limit(5).get();
        console.log(`📊 ${collectionName}: ${snapshot.size} document(s)`);
        totalDocs += snapshot.size;
        
        if (snapshot.size > 0) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          console.log(`   Sample fields: ${Object.keys(data).slice(0, 5).join(', ')}`);
          
          // For customers collection, show how many are leads vs customers
          if (collectionName === 'customers') {
            const allDocs = await testCollection.get();
            const leads = allDocs.docs.filter(doc => doc.data().customerType === 'lead').length;
            const customers = allDocs.docs.filter(doc => doc.data().customerType === 'customer').length;
            console.log(`   Breakdown: ${leads} leads, ${customers} customers`);
          }
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error);
      }
    }
    
    console.log(`\n📈 Total documents found: ${totalDocs}`);
    
    if (totalDocs === 0) {
      console.log('💡 No documents found in any collection. This might mean:');
      console.log('   - Your database is empty');
      console.log('   - Collections haven\'t been created yet');
      console.log('   - The migration may not be needed');
    } else {
      console.log('✅ Ready for migration!');
    }
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Admin SDK test failed:', error.message);
    
    if (error.message.includes('service account')) {
      console.log('\n💡 This error suggests you need a service account key file.');
      console.log('   Follow the instructions above to download and configure it.');
    } else if (error.message.includes('permission')) {
      console.log('\n💡 Permission error - the service account might need proper roles.');
      console.log('   Ensure the service account has "Firebase Admin SDK Administrator Service Agent" role.');
    } else {
      console.log('\n💡 Unexpected error. Check your Firebase project configuration.');
    }
    
    process.exit(1);
  }
}

// Set timeout
setTimeout(() => {
  console.error('\n❌ Test timed out after 15 seconds');
  console.error('This usually indicates a network or authentication issue');
  process.exit(1);
}, 15000);

testAdminSetup();
