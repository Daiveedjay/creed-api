#! /bin/bash
docker run -d -p 5433:5432 --name test_db creed-postgres
sleep 30
cross-env DATABASE_URL="postgresql://test_db_user:test_db_password@localhost:5433/test_db" npx prisma db push
cross-env DATABASE_URL="postgresql://test_db_user:test_db_password@localhost:5433/test_db" jest

docker stop test_db
docker rm test_db