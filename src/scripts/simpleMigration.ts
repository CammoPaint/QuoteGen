/**
 * Simplified admin migration script
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting simplified user fields migration...');

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

async function runMigration() {
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

    // Define field mappings
    const fieldMappings = {
      'assignedTo': 'assignedToUserId',
      'assignedToId': 'assignedToUserId',
      'assignedToName': 'assignedToUserName',
      'userId': 'createdByUserId',
      'userName': 'createdByUserName'
    };

    console.log('\n🔄 Processing customers collection (includes leads)...');

    const customersRef = db.collection('customers');
    const snapshot = await customersRef.get();
    
    console.log(`   Found ${snapshot.size} documents`);

    const batch = db.batch();
    let updatedCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const updates: any = {};
      
      // Map old fields to new fields
      Object.entries(fieldMappings).forEach(([oldField, newField]) => {
        if (data[oldField] !== undefined && data[oldField] !== null) {
          console.log(`   ${doc.id}: ${oldField} -> ${newField}`);
          updates[newField] = data[oldField];
          updates[oldField] = null; // Mark for deletion
        }
      });
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      console.log(`\n📝 Committing ${updatedCount} document updates...`);
      await batch.commit();
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ No migration needed - all fields are already up to date');
    }

    console.log(`\n📊 Summary: ${updatedCount} documents updated`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
