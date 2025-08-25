/**
 * Migration script to set default assignedToUser values and fill empty createdByUserName fields
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting user assignment migration...');

// Default user values
const DEFAULT_USER = {
  assignedToUserName: "Cameron Moses",
  assignedToUserId: "nNQWQovIcOgI38NC06khGo7grAl2",
  createdByUserName: "Cameron Moses"
};

// Load environment variables
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

async function runAssignmentMigration() {
  try {
    console.log('🔧 Initializing Firebase Admin...');
    
    // Initialize Firebase Admin
    if (getApps().length === 0) {
      const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      const { cert } = await import('firebase-admin/app');
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
    }

    const db = getFirestore();
    console.log('✅ Firebase Admin initialized');

    console.log('\n📋 Default values to apply:');
    console.log(`   assignedToUserName: "${DEFAULT_USER.assignedToUserName}"`);
    console.log(`   assignedToUserId: "${DEFAULT_USER.assignedToUserId}"`);
    console.log(`   createdByUserName: "${DEFAULT_USER.createdByUserName}" (when null/empty)`);

    console.log('\n🔄 Processing customers collection (includes leads)...');

    const customersRef = db.collection('customers');
    const snapshot = await customersRef.get();
    
    console.log(`   Found ${snapshot.size} documents`);

    const batch = db.batch();
    let updatedCount = 0;
    let assignedToUpdates = 0;
    let createdByUpdates = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const updates: any = {};
      
      // Always set assignedToUser fields (these are new fields we want to populate)
      updates.assignedToUserName = DEFAULT_USER.assignedToUserName;
      updates.assignedToUserId = DEFAULT_USER.assignedToUserId;
      assignedToUpdates++;
      
      // Set createdByUserName if it's null, undefined, or empty string
      if (!data.createdByUserName || data.createdByUserName.trim() === '') {
        updates.createdByUserName = DEFAULT_USER.createdByUserName;
        createdByUpdates++;
        console.log(`   ${doc.id}: Setting empty createdByUserName -> "${DEFAULT_USER.createdByUserName}"`);
      } else {
        console.log(`   ${doc.id}: createdByUserName already set to "${data.createdByUserName}"`);
      }
      
      console.log(`   ${doc.id}: Setting assignedTo -> "${DEFAULT_USER.assignedToUserName}"`);
      
      batch.update(doc.ref, updates);
      updatedCount++;
    });

    if (updatedCount > 0) {
      console.log(`\n📝 Committing ${updatedCount} document updates...`);
      await batch.commit();
      console.log('✅ Assignment migration completed successfully!');
    } else {
      console.log('✅ No updates needed');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Documents processed: ${updatedCount}`);
    console.log(`   - assignedToUser fields set: ${assignedToUpdates}`);
    console.log(`   - Empty createdByUserName fields filled: ${createdByUpdates}`);

  } catch (error) {
    console.error('❌ Assignment migration failed:', error);
    process.exit(1);
  }
}

runAssignmentMigration();
