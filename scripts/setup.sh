#!/bin/bash
# Quick setup script for Cloudflare resources

set -e

echo "🚀 Setting up FFL on Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Login check
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Create D1 database
echo "Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create ffl_db)
echo "$DB_OUTPUT"

# Extract database_id (basic extraction - user should verify)
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' | head -1)
if [ -n "$DB_ID" ]; then
    echo ""
    echo "⚠️  Please update wrangler.toml with this database_id: $DB_ID"
    echo "   Edit: [[d1_databases]] -> database_id = \"$DB_ID\""
fi

# Create R2 bucket
echo ""
echo "Creating R2 bucket..."
wrangler r2 bucket create ffl-evidence

# Run migrations
echo ""
echo "Running database migrations..."
if [ -n "$DB_ID" ]; then
    wrangler d1 execute ffl_db --file=./migrations/0001_init.sql
else
    echo "⚠️  Please run migrations manually after updating wrangler.toml:"
    echo "   wrangler d1 execute ffl_db --file=./migrations/0001_init.sql"
fi

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with the database_id above"
echo "2. Create AI Search index in Cloudflare Dashboard (Workers & Pages → AI Search)"
echo "3. Configure index to use R2 bucket 'ffl-evidence' with path 'evidence/'"
echo "4. Deploy: wrangler deploy"
echo "5. Seed data: BASE_URL=https://ffl.YOUR_SUBDOMAIN.workers.dev npm run seed"
