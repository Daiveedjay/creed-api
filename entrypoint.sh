#!/bin/sh
set -e

echo "Checking for pending Prisma migrations..."

# Check if the _prisma_migrations table exists and has unapplied migrations
HAS_PENDING=$(npx prisma migrate status --schema prisma/schema.prisma --json | jq '.executed === .applied ? "no" : "yes"')

if [ "$HAS_PENDING" = "yes" ]; then
  echo "Pending migrations found. Running migrate deploy..."
  npx prisma migrate deploy
else
  echo "No pending migrations. Skipping."
fi

echo "Starting application..."
exec node dist/main
