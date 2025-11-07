// Set test environment variables before importing any modules
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/medifast_test?schema=public';
process.env.JWT_SECRET = 'medifast_jwt_test_secret_key_2024_super_secure';
process.env.PORT = '3003';

// Load test environment file if it exists
const path = require('path');
const fs = require('fs');

const testEnvPath = path.join(__dirname, '..', '.env.test');
if (fs.existsSync(testEnvPath)) {
  require('dotenv').config({ path: testEnvPath });
}