# Use the official PostgreSQL image from Docker Hub
FROM postgres

# Environment variables
ENV POSTGRES_USER=test_db_user
ENV POSTGRES_PASSWORD=test_db_password
ENV POSTGRES_DB=test_db

# Expose PostgreSQL port
EXPOSE 5432

# Execute the PostgreSQL server
CMD ["postgres"]
