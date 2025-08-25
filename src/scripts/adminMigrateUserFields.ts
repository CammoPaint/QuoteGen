/**
 * Admin migration script using Firebase Admin SDK
 * This bypasses Firestore security rules and requires a service account key
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

interface MigrationStats {
  customers: number; // This includes both customers and leads
  tasks: number;
  salesTasks: number;
  errors: string[];
}

class AdminUserFieldsMigrator {
  private db: any;
  private stats: MigrationStats = {
    customers: 0, // This includes both customers and leads
    tasks: 0,
    salesTasks: 0,
    errors: []
  };

  constructor() {
    console.log('🔧 Initializing AdminUserFieldsMigrator...');
    this.initializeFirebase();
    console.log('✅ AdminUserFieldsMigrator initialized successfully');
  }

  private initializeFirebase(): void {
    try {
      // Check if already initialized
      if (getApps().length === 0) {
        // Try to load service account key
        let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountPath) {
          // Try common paths
          const commonPaths = [
            join(process.cwd(), 'firebase-service-account.json'),
            join(process.cwd(), 'serviceAccountKey.json'),
            join(process.cwd(), 'firebase-adminsdk.json')
          ];
          
          for (const path of commonPaths) {
            try {
              readFileSync(path, 'utf8');
              serviceAccountPath = path;
              break;
            } catch {
              // File doesn't exist, try next
            }
          }
        }

        if (serviceAccountPath) {
          console.log('🔑 Using Firebase Admin SDK with service account');
          const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
          
          initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID
          });
        } else {
          console.log('🔑 Using Firebase Admin SDK with default credentials');
          initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID
          });
        }
      }

      this.db = getFirestore();
      console.log('✅ Firebase Admin SDK initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      console.error('\n💡 To fix this, you need to:');
      console.error('1. Download your Firebase service account key from Firebase Console');
      console.error('2. Save it as "firebase-service-account.json" in your project root');
      console.error('3. Or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
      process.exit(1);
    }
  }

  async migrateCollection(collectionName: string, fieldMappings: { [oldField: string]: string }): Promise<void> {
    console.log(`🔄 Migrating ${collectionName} collection...`);
    
    try {
      const collectionRef = this.db.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      console.log(`   Found ${snapshot.size} documents to process`);
      
      const batch = this.db.batch();
      let batchCount = 0;
      let updatedCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const updates: any = {};
        
        console.log(`   Processing document ${doc.id}...`);
        
        // Map old fields to new fields
        Object.entries(fieldMappings).forEach(([oldField, newField]) => {
          if (data[oldField] !== undefined && data[oldField] !== null) {
            console.log(`     Found ${oldField}: "${data[oldField]}" -> ${newField}`);
            updates[newField] = data[oldField];
            updates[oldField] = null; // Mark for deletion
          }
        });
        
        if (Object.keys(updates).length > 0) {
          console.log(`     Updating ${Object.keys(updates).length / 2} field pairs`);
          batch.update(doc.ref, updates);
          batchCount++;
          updatedCount++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`   Committed batch of ${batchCount} updates...`);
            batchCount = 0;
          }
        } else {
          console.log(`     No old fields found in document ${doc.id}`);
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        console.log(`   Committing final batch of ${batchCount} updates...`);
        await batch.commit();
      }
      
      // Update stats based on collection name
      switch (collectionName) {
        case 'customers': // This includes both customers and leads
          this.stats.customers = updatedCount;
          break;
        case 'tasks':
          this.stats.tasks = updatedCount;
          break;
        case 'salesTasks':
          this.stats.salesTasks = updatedCount;
          break;
      }
      console.log(`✅ ${collectionName} migration completed: ${updatedCount} documents updated`);
      
    } catch (error) {
      const errorMsg = `Error migrating ${collectionName}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  async runMigration(): Promise<void> {
    console.log('🚀 Starting admin user fields migration...\n');
    console.log('📋 Target field mappings:');
    console.log('   assignedTo -> assignedToUserId');
    console.log('   assignedToId -> assignedToUserId');
    console.log('   assignedToName -> assignedToUserName');
    console.log('   userId -> createdByUserId');
    console.log('   userName -> createdByUserName\n');
    
    const startTime = Date.now();
    
    // Define field mappings for each collection
    // Note: Leads are stored in the customers collection with customerType: 'lead'
    const migrations = [
      {
        collection: 'customers', // This includes both customers and leads
        mappings: {
          'assignedTo': 'assignedToUserId',
          'assignedToId': 'assignedToUserId',
          'assignedToName': 'assignedToUserName',
          'userId': 'createdByUserId',
          'userName': 'createdByUserName'
        } as { [key: string]: string }
      },
      {
        collection: 'tasks',
        mappings: {
          'assignedTo': 'assignedToUserId',
          'assignedToId': 'assignedToUserId'
        } as { [key: string]: string }
      },
      {
        collection: 'salesTasks',
        mappings: {
          'assignedTo': 'assignedToUserId',
          'assignedToId': 'assignedToUserId',
          'assignedToName': 'assignedToUserName'
        } as { [key: string]: string }
      }
    ];

    for (const migration of migrations) {
      await this.migrateCollection(migration.collection, migration.mappings);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Customers/Leads updated: ${this.stats.customers}`);
    console.log(`- Tasks updated: ${this.stats.tasks}`);
    console.log(`- Sales tasks updated: ${this.stats.salesTasks}`);
    console.log(`- Total duration: ${duration.toFixed(2)} seconds`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ Migration completed successfully with no errors!');
    }
  }
}

// Run migration if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const timeout = setTimeout(() => {
    console.error('❌ Migration timed out after 60 seconds');
    process.exit(1);
  }, 60000);

  const migrator = new AdminUserFieldsMigrator();
  migrator.runMigration()
    .then(() => {
      clearTimeout(timeout);
      console.log('Admin migration finished');
      process.exit(0);
    })
    .catch((error) => {
      clearTimeout(timeout);
      console.error('Admin migration failed:', error);
      process.exit(1);
    });
}

export default AdminUserFieldsMigrator;
