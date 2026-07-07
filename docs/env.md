# Configuration & Environment Variables

This document describes the environment variables available to configure the `media-render` microservice. 

To customize your environment:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adjust the values below to match your server capacity.

## Variables Reference

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3005` | The port on which the Elysia HTTP server listens. |
| `BACKEND_URL` | `http://localhost:4000` | Endpoint for backend reporting or callbacks. |
| `CONCURRENT_RENDER_LIMIT` | `2` | Maximum number of parallel rendering tasks allowed. |
| `MAX_MEMORY_USAGE_PERCENT` | `99` | Maximum system memory usage percentage threshold to accept new render requests. |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Maximum RSS memory (MB) the Bun engine can use before rejecting tasks. |
| `MAX_CPU_LOAD_RATIO` | `0.9` | Max 1-minute CPU load average ratio allowed (e.g., `0.9` = `90%` of cores busy). |
