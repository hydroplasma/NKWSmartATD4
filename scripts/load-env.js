const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env if it exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
