# Stage 1: Build dependencies in a cached layer
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into /root/.local for easy caching & size reduction
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Clean and secure runtime stage
FROM python:3.11-slim as runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed libraries from the builder stage
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Create non-root system group & user for secure runtime compliance
RUN groupadd -g 10001 appgroup && \
    useradd -r -u 10001 -g appgroup -d /home/appuser -m appuser

# Correct permissions for the application and user environments
RUN chown -R appuser:appgroup /app /home/appuser

# Align codebase with standard PYTHONPATH mapping
COPY --chown=appuser:appgroup app /app/backend/app

# Activate the non-root profile
USER appuser

EXPOSE 8000

# Set Python microtuning variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Production healthcheck assessing internal gateway ports
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Default ASGI command (can be overridden by docker-compose)
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
