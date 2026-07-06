FROM oven/bun:1.1-slim

# Cài đặt các thư viện FFmpeg C API phục vụ cho NodeAV
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    build-essential \
    python3 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .

EXPOSE 3005
CMD ["bun", "run", "src/index.ts"]
