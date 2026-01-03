#!/bin/bash

# init_db.sh - Database bootstrapping and .env generation

set -e

# Configuration
DOMAIN="ozuplanner.com"
DB_NAME="ozu_schedule"
DB_USER="ozu_user"
BACKEND_DIR="./backend"

echo "🗄️ Starting Database Initialization..."

# 1. Generate strong random password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '+/=' | cut -c1-16)
SESSION_SECRET=$(openssl rand -base64 32)

echo "Generating .env file..."
cat > "${BACKEND_DIR}/.env" <<EOF
# Server Configuration
PORT=8081
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Security
SESSION_SECRET=${SESSION_SECRET}
ALLOWED_ORIGINS=http://localhost:5173,https://${DOMAIN},https://www.${DOMAIN}
EOF

echo "✓ .env file generated in ${BACKEND_DIR}"

# 2. Create PostgreSQL User and Database
echo "Creating PostgreSQL user and database..."
sudo -u postgres psql <<EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

# 3. Setup Python Virtual Environment and Install Dependencies
echo "Setting up Python environment..."
cd "${BACKEND_DIR}/database_python"
python3 -m venv venv
source venv/bin/activate
pip install psycopg2-binary
cd ../..

# 4. Populate Database (Using Python)
echo "Populating database with course data..."
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=${DB_USER}
export DB_PASSWORD=${DB_PASSWORD}
export DB_NAME=${DB_NAME}

cd "${BACKEND_DIR}/database_python"
source venv/bin/activate
python3 database.py
deactivate
cd ../..

# 5. Initialize Session Table (Using Node)
echo "Initializing session table..."
cd "${BACKEND_DIR}"
npm install
node init_session_table.js
cd ..

echo "✅ Database initialization complete!"
echo "Your generated database password: ${DB_PASSWORD}"
echo "Keep this safe! It is stored in backend/.env"
