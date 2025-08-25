const fs = require('fs-extra');
const path = require('path');

async function copyTemplates() {
  try {
    const srcDir = path.join(__dirname, 'src', 'templates');
    const destDir = path.join(__dirname, 'lib', 'templates');
    
    // Ensure the destination directory exists
    await fs.ensureDir(destDir);
    
    // Copy the templates directory
    await fs.copy(srcDir, destDir);
    
    console.log('Templates copied successfully to lib/templates/');
  } catch (error) {
    console.error('Error copying templates:', error);
    process.exit(1);
  }
}

copyTemplates();
