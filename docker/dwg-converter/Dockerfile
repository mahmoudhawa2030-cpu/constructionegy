FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    librecad \
    xvfb \
    wget \
    curl \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy conversion script
COPY convert.sh /app/convert.sh
RUN chmod +x /app/convert.sh

# Run conversion script
ENTRYPOINT ["/app/convert.sh"]
