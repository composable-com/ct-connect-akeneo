const fs = require('fs');
const path = require('path');

// Path to the jest config file
const configPath = path.join(__dirname, '..', 'jest.test.config.js');

// Read the current config file
const configContent = fs.readFileSync(configPath, 'utf8');

// Get the current coverage from arguments
const newThreshold = process.argv[2] || '20';

// Validate input
const thresholdValue = parseInt(newThreshold, 10);
if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
  console.error('Please provide a valid coverage threshold percentage (0-100)');
  process.exit(1);
}

// Update the threshold values in the config
const updatedContent = configContent
  .replace(
    /branches: \d+,\s*\/\/ Goal: 75%/g,
    `branches: ${thresholdValue}, // Goal: 75%`
  )
  .replace(
    /functions: \d+,\s*\/\/ Goal: 75%/g,
    `functions: ${thresholdValue}, // Goal: 75%`
  )
  .replace(
    /lines: \d+,\s*\/\/ Goal: 75%/g,
    `lines: ${thresholdValue}, // Goal: 75%`
  )
  .replace(
    /statements: \d+,\s*\/\/ Goal: 75%/g,
    `statements: ${thresholdValue}, // Goal: 75%`
  );

// Write the updated content back to the file
fs.writeFileSync(configPath, updatedContent);

console.log(`✅ Updated coverage thresholds to ${thresholdValue}%`);
console.log('Run "yarn test" to verify the new thresholds.');
