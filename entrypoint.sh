#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Skipping migrations (DB already up to date or unreachable)"

echo "Starting application..."
exec node dist/main