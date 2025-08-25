/**
 * Migration script to update user field names in Leads, Customers, and Tasks
 * This script renames fields to be more descriptive:
 * - assignedTo -> assignedToUserId
 * - userId -> createdByUserId  
 * - userName -> createdByUserName
 * - assignedToId -> assignedToUserId
 * - assignedToName -> assignedToUserName
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
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

// Load environment variables
loadEnvFile();

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and ensure all Firebase configuration is set.');
  process.exit(1);
}

// Firebase config - update with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface MigrationStats {
  leads: number;
  customers: number;
  tasks: number;
  salesTasks: number;
  errors: string[];
}

class UserFieldsMigrator {
  private stats: MigrationStats = {
    leads: 0,
    customers: 0,
    tasks: 0,
    salesTasks: 0,
    errors: []
  };

  async migrateLeads(): Promise<void> {
    console.log('Starting leads migration...');
    
    try {
      const leadsCollection = collection(db, 'leads');
      const snapshot = await getDocs(leadsCollection);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates: any = {};
        
        // Map old fields to new fields
        if (data.assignedTo) {
          updates.assignedToUserId = data.assignedTo;
          updates.assignedTo = null; // Mark for deletion
        }
        
        if (data.assignedToId) {
          updates.assignedToUserId = data.assignedToId;
          updates.assignedToId = null; // Mark for deletion
        }
        
        if (data.assignedToName) {
          updates.assignedToUserName = data.assignedToName;
          updates.assignedToName = null; // Mark for deletion
        }
        
        if (data.userId) {
          updates.createdByUserId = data.userId;
          updates.userId = null; // Mark for deletion
        }
        
        if (data.userName) {
          updates.createdByUserName = data.userName;
          updates.userName = null; // Mark for deletion
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'leads', docSnap.id), updates);
          batchCount++;
          this.stats.leads++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            const newBatch = writeBatch(db);
            Object.assign(batch, newBatch);
            batchCount = 0;
          }
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Leads migration completed: ${this.stats.leads} records updated`);
    } catch (error) {
      const errorMsg = `Error migrating leads: ${error}`;
      console.error(errorMsg);
      this.stats.errors.push(errorMsg);
    }
  }

  async migrateCustomers(): Promise<void> {
    console.log('Starting customers migration...');
    
    try {
      const customersCollection = collection(db, 'customers');
      const snapshot = await getDocs(customersCollection);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates: any = {};
        
        // Map old fields to new fields (customers may have these fields when used as leads)
        if (data.assignedTo) {
          updates.assignedToUserId = data.assignedTo;
          updates.assignedTo = null; // Mark for deletion
        }
        
        if (data.userId) {
          updates.createdByUserId = data.userId;
          updates.userId = null; // Mark for deletion
        }
        
        if (data.userName) {
          updates.createdByUserName = data.userName;
          updates.userName = null; // Mark for deletion
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'customers', docSnap.id), updates);
          batchCount++;
          this.stats.customers++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            const newBatch = writeBatch(db);
            Object.assign(batch, newBatch);
            batchCount = 0;
          }
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Customers migration completed: ${this.stats.customers} records updated`);
    } catch (error) {
      const errorMsg = `Error migrating customers: ${error}`;
      console.error(errorMsg);
      this.stats.errors.push(errorMsg);
    }
  }

  async migrateTasks(): Promise<void> {
    console.log('Starting tasks migration...');
    
    try {
      const tasksCollection = collection(db, 'tasks');
      const snapshot = await getDocs(tasksCollection);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates: any = {};
        
        // Map old fields to new fields
        if (data.assignedTo) {
          updates.assignedToUserId = data.assignedTo;
          updates.assignedTo = null; // Mark for deletion
        }
        
        if (data.assignedToId) {
          updates.assignedToUserId = data.assignedToId;
          updates.assignedToId = null; // Mark for deletion
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'tasks', docSnap.id), updates);
          batchCount++;
          this.stats.tasks++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            const newBatch = writeBatch(db);
            Object.assign(batch, newBatch);
            batchCount = 0;
          }
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Tasks migration completed: ${this.stats.tasks} records updated`);
    } catch (error) {
      const errorMsg = `Error migrating tasks: ${error}`;
      console.error(errorMsg);
      this.stats.errors.push(errorMsg);
    }
  }

  async migrateSalesTasks(): Promise<void> {
    console.log('Starting sales tasks migration...');
    
    try {
      const salesTasksCollection = collection(db, 'salesTasks');
      const snapshot = await getDocs(salesTasksCollection);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates: any = {};
        
        // Map old fields to new fields
        if (data.assignedTo) {
          updates.assignedToUserId = data.assignedTo;
          updates.assignedTo = null; // Mark for deletion
        }
        
        if (data.assignedToId) {
          updates.assignedToUserId = data.assignedToId;
          updates.assignedToId = null; // Mark for deletion
        }
        
        if (data.assignedToName) {
          updates.assignedToUserName = data.assignedToName;
          updates.assignedToName = null; // Mark for deletion
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'salesTasks', docSnap.id), updates);
          batchCount++;
          this.stats.salesTasks++;
          
          // Commit batch every 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            const newBatch = writeBatch(db);
            Object.assign(batch, newBatch);
            batchCount = 0;
          }
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Sales tasks migration completed: ${this.stats.salesTasks} records updated`);
    } catch (error) {
      const errorMsg = `Error migrating sales tasks: ${error}`;
      console.error(errorMsg);
      this.stats.errors.push(errorMsg);
    }
  }

  async runMigration(): Promise<void> {
    console.log('🚀 Starting user fields migration...\n');
    
    const startTime = Date.now();
    
    await Promise.all([
      this.migrateLeads(),
      this.migrateCustomers(),
      this.migrateTasks(),
      this.migrateSalesTasks()
    ]);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Leads updated: ${this.stats.leads}`);
    console.log(`- Customers updated: ${this.stats.customers}`);
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
// Check if this is the main module in ES module environment
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const migrator = new UserFieldsMigrator();
  migrator.runMigration()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default UserFieldsMigrator;
