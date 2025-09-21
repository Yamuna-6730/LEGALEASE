FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Set environment variable for Google credentials (mounted by Cloud Run)
ENV GOOGLE_APPLICATION_CREDENTIALS=/secrets/service-account.json

EXPOSE 8080

CMD exec gunicorn --bind :8080 --workers 2 --timeout 120 legalease.wsgi:application
