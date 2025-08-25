/**
 * Pre-migration validation script
 * This script checks the current state of the database to understand what needs to be migrated
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
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

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🔧 Initializing Firebase connection...');
console.log(`📍 Project ID: ${firebaseConfig.projectId}`);

// Initialize Firebase
let db: any;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase connection initialized successfully\n');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  process.exit(1);
}

interface ValidationReport {
  collection: string;
  totalDocuments: number;
  documentsWithOldFields: number;
  oldFields: { [key: string]: number };
  newFields: { [key: string]: number };
}

class MigrationValidator {
  private reports: ValidationReport[] = [];

  async validateCollection(collectionName: string, oldFieldMappings: { [oldField: string]: string }): Promise<ValidationReport> {
    console.log(`🔍 Validating ${collectionName} collection...`);
    
    const report: ValidationReport = {
      collection: collectionName,
      totalDocuments: 0,
      documentsWithOldFields: 0,
      oldFields: {},
      newFields: {}
    };

    try {
      const collectionRef = collection(db, collectionName);
      console.log(`   Fetching documents from ${collectionName}...`);
      const snapshot = await getDocs(collectionRef);
      
      report.totalDocuments = snapshot.size;
      console.log(`   Found ${snapshot.size} documents in ${collectionName}`);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let hasOldFields = false;
        
        // Check for old fields
        Object.keys(oldFieldMappings).forEach(oldField => {
          if (data[oldField] !== undefined && data[oldField] !== null) {
            report.oldFields[oldField] = (report.oldFields[oldField] || 0) + 1;
            hasOldFields = true;
          }
        });
        
        // Check for new fields
        Object.values(oldFieldMappings).forEach(newField => {
          if (data[newField] !== undefined && data[newField] !== null) {
            report.newFields[newField] = (report.newFields[newField] || 0) + 1;
          }
        });
        
        if (hasOldFields) {
          report.documentsWithOldFields++;
        }
      });
      
      console.log(`   ✅ Completed validation for ${collectionName}`);
      
    } catch (error) {
      console.error(`❌ Error validating ${collectionName}:`, error);
    }

    return report;
  }

  async validateAllCollections(): Promise<void> {
    console.log('🚀 Starting pre-migration validation...\n');

    const validations = [
      this.validateCollection('leads', {
        'assignedTo': 'assignedToUserId',
        'assignedToId': 'assignedToUserId',
        'assignedToName': 'assignedToUserName',
        'userId': 'createdByUserId',
        'userName': 'createdByUserName'
      }),
      this.validateCollection('customers', {
        'assignedTo': 'assignedToUserId',
        'userId': 'createdByUserId',
        'userName': 'createdByUserName'
      }),
      this.validateCollection('tasks', {
        'assignedTo': 'assignedToUserId',
        'assignedToId': 'assignedToUserId'
      }),
      this.validateCollection('salesTasks', {
        'assignedTo': 'assignedToUserId',
        'assignedToId': 'assignedToUserId',
        'assignedToName': 'assignedToUserName'
      })
    ];

    this.reports = await Promise.all(validations);
    this.printReport();
  }

  private printReport(): void {
    console.log('\n📊 Validation Report:\n');
    
    let totalDocuments = 0;
    let totalDocumentsNeedingMigration = 0;
    
    this.reports.forEach(report => {
      console.log(`📁 ${report.collection.toUpperCase()}:`);
      console.log(`   Total documents: ${report.totalDocuments}`);
      console.log(`   Documents needing migration: ${report.documentsWithOldFields}`);
      
      if (Object.keys(report.oldFields).length > 0) {
        console.log('   Old fields found:');
        Object.entries(report.oldFields).forEach(([field, count]) => {
          console.log(`     - ${field}: ${count} documents`);
        });
      }
      
      if (Object.keys(report.newFields).length > 0) {
        console.log('   New fields already present:');
        Object.entries(report.newFields).forEach(([field, count]) => {
          console.log(`     - ${field}: ${count} documents`);
        });
      }
      
      if (Object.keys(report.oldFields).length === 0 && Object.keys(report.newFields).length === 0) {
        console.log('   ✅ No migration needed for this collection');
      }
      
      console.log('');
      
      totalDocuments += report.totalDocuments;
      totalDocumentsNeedingMigration += report.documentsWithOldFields;
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Total documents across all collections: ${totalDocuments}`);
    console.log(`   Total documents needing migration: ${totalDocumentsNeedingMigration}`);
    
    if (totalDocumentsNeedingMigration === 0) {
      console.log('   🎉 No migration needed! All data is up to date.');
    } else {
      console.log(`   🔄 Migration recommended for ${totalDocumentsNeedingMigration} documents.`);
      console.log('\n   To run migration: npm run migrate:user-fields');
    }
  }
}

// Run validation if this file is executed directly
// Check if this is the main module in ES module environment
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  // Set a timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.error('❌ Validation timed out after 30 seconds');
    console.error('This might indicate a Firebase connection issue or authentication problem');
    process.exit(1);
  }, 30000);

  const validator = new MigrationValidator();
  validator.validateAllCollections()
    .then(() => {
      clearTimeout(timeout);
      console.log('Validation completed');
      process.exit(0);
    })
    .catch((error) => {
      clearTimeout(timeout);
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export default MigrationValidator;
