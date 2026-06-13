FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ./app /app/app
COPY ./loader /app/loader

# Set PYTHONPATH
ENV PYTHONPATH=/app
