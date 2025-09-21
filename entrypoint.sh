#!/bin/sh
set -e

# echo "Checking for pending Prisma migrations..."

# PENDING=$(npx prisma migrate status --schema=prisma/schema.prisma | grep "Following migration have not yet been applied:" | wc -l)

# if [ "$PENDING" -eq 1 ]; then
#   echo "Pending migrations found. Running migrate deploy..."
#   npx prisma migrate deploy
# else
#   echo "No pending migrations. Skipping."
# fi

echo "Starting application..."
exec node dist/main
