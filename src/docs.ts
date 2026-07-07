export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Video Rendering Server API",
    version: "1.0.0",
    description: "API for dynamic video rendering using FFmpeg (NodeAV) and Bun"
  },
  paths: {
    "/health": {
      get: {
        summary: "Check server health and resource status",
        description: "Returns system resource details (RAM, CPU, Bun process RSS) and the count of currently processing render tasks. Returns HTTP 503 if system resources are degraded.",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    reason: { type: "string", nullable: true, example: null },
                    activeRenders: { type: "number", example: 0 },
                    concurrentLimit: { type: "number", example: 2 },
                    resources: {
                      type: "object",
                      properties: {
                        systemMemoryUsagePercent: { type: "number", example: 45.2 },
                        processMemoryMb: { type: "number", example: 128.5 },
                        cpuCores: { type: "number", example: 8 },
                        loadAvg1Min: { type: "number", example: 1.25 },
                        cpuLoadRatio: { type: "number", example: 0.15 }
                      }
                    },
                    timestamp: { type: "string", example: "2026-07-07T00:00:00.000Z" }
                  }
                }
              }
            }
          },
          "503": {
            description: "Server resources degraded / overloaded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "degraded" },
                    reason: { type: "string", example: "System memory usage (99.2%) exceeded limit (85%)" },
                    activeRenders: { type: "number", example: 2 },
                    concurrentLimit: { type: "number", example: 2 },
                    resources: { type: "object" },
                    timestamp: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/render": {
      post: {
        summary: "Render video from Editor Manifest",
        description: "Performs isomorphic timeline compositions (video gap-filling, trimming, overlay blending, text rasterization, and multi-track audio mixing) into a single MP4/WebM video.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/EditorManifest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Render completed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Render completed successfully!" },
                    videoPath: { type: "string", example: "./renders/output-xxx.mp4" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      EditorManifest: {
        type: "object",
        required: ["id", "settings", "tracks"],
        properties: {
          id: { type: "string", example: "manifest-123" },
          settings: {
            type: "object",
            required: ["width", "height", "fps", "format"],
            properties: {
              width: { type: "number", default: 1920, example: 1920 },
              height: { type: "number", default: 1080, example: 1080 },
              fps: { type: "number", default: 30, example: 30 },
              format: { type: "string", enum: ["mp4", "webm"], default: "mp4", example: "mp4" }
            }
          },
          tracks: {
            type: "array",
            items: {
              anyOf: [
                { $ref: "#/components/schemas/VideoTrack" },
                { $ref: "#/components/schemas/AudioTrack" },
                { $ref: "#/components/schemas/TextTrack" }
              ]
            }
          }
        }
      },
      BaseTimelineElement: {
        type: "object",
        required: ["id", "name", "duration", "startTime", "trimStart", "trimEnd"],
        properties: {
          id: { type: "string", example: "clip-1" },
          name: { type: "string", example: "My Clip Name" },
          duration: { type: "number", description: "Visible duration on timeline (seconds)", example: 10 },
          startTime: { type: "number", description: "Position on timeline (seconds)", example: 0 },
          trimStart: { type: "number", description: "Trim from source start (seconds)", example: 0 },
          trimEnd: { type: "number", description: "Trim from source end (seconds)", example: 0 }
        }
      },
      VideoElement: {
        allOf: [
          { $ref: "#/components/schemas/BaseTimelineElement" },
          {
            type: "object",
            required: ["type", "sourceUrl", "width", "height"],
            properties: {
              type: { type: "string", enum: ["video"], example: "video" },
              sourceUrl: { type: "string", description: "HTTP/HTTPS URL or absolute local file path", example: "https://www.w3schools.com/html/mov_bbb.mp4" },
              volume: { type: "number", default: 1.0, example: 1.0 },
              width: { type: "number", example: 1920 },
              height: { type: "number", example: 1080 },
              x: { type: "number", default: 0, example: 0 },
              y: { type: "number", default: 0, example: 0 },
              opacity: { type: "number", default: 1.0, example: 1.0 }
            }
          }
        ]
      },
      ImageElement: {
        allOf: [
          { $ref: "#/components/schemas/BaseTimelineElement" },
          {
            type: "object",
            required: ["type", "sourceUrl", "width", "height"],
            properties: {
              type: { type: "string", enum: ["image"], example: "image" },
              sourceUrl: { type: "string", description: "HTTP/HTTPS URL or absolute local file path", example: "https://picsum.photos/1920/1080" },
              width: { type: "number", example: 1920 },
              height: { type: "number", example: 1080 },
              x: { type: "number", default: 0, example: 0 },
              y: { type: "number", default: 0, example: 0 },
              opacity: { type: "number", default: 1.0, example: 1.0 }
            }
          }
        ]
      },
      AudioElement: {
        allOf: [
          { $ref: "#/components/schemas/BaseTimelineElement" },
          {
            type: "object",
            required: ["type", "sourceUrl"],
            properties: {
              type: { type: "string", enum: ["audio"], example: "audio" },
              sourceUrl: { type: "string", description: "HTTP/HTTPS URL or absolute local file path", example: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
              volume: { type: "number", default: 1.0, example: 1.0 }
            }
          }
        ]
      },
      TextElement: {
        allOf: [
          { $ref: "#/components/schemas/BaseTimelineElement" },
          {
            type: "object",
            required: ["type", "text", "style"],
            properties: {
              type: { type: "string", enum: ["text"], example: "text" },
              text: { type: "string", example: "Hello World!" },
              style: {
                type: "object",
                required: ["fontSize", "color", "fontFamily"],
                properties: {
                  fontSize: { type: "number", default: 24, example: 32 },
                  color: { type: "string", default: "white", example: "#ff0000" },
                  fontFamily: { type: "string", default: "sans-serif", example: "Arial" },
                  x: { type: "number", description: "X coordinate (optional, defaults to horizontal center)", example: 320 },
                  y: { type: "number", description: "Y coordinate (optional, defaults to bottom aligned)", example: 260 },
                  textAlign: { type: "string", enum: ["left", "right", "center", "start", "end"], default: "center", example: "center" },
                  strokeColor: { type: "string", description: "Subtitle border color (optional)", example: "black" },
                  strokeWidth: { type: "number", default: 4, example: 4 },
                  fontUrl: { type: "string", description: "Remote font URL (.ttf or .otf)", example: "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxK.ttf" }
                }
              },
              opacity: { type: "number", default: 1.0, example: 1.0 }
            }
          }
        ]
      },
      VideoTrack: {
        type: "object",
        required: ["id", "name", "type", "elements", "isMain"],
        properties: {
          id: { type: "string", example: "track-video-1" },
          name: { type: "string", example: "Main Video Track" },
          type: { type: "string", enum: ["video"], example: "video" },
          elements: {
            type: "array",
            items: {
              anyOf: [
                { $ref: "#/components/schemas/VideoElement" },
                { $ref: "#/components/schemas/ImageElement" }
              ]
            }
          },
          isMain: { type: "boolean", description: "Set to true for the primary base Video Track", example: true },
          muted: { type: "boolean", default: false, example: false },
          hidden: { type: "boolean", default: false, example: false }
        }
      },
      AudioTrack: {
        type: "object",
        required: ["id", "name", "type", "elements"],
        properties: {
          id: { type: "string", example: "track-audio-1" },
          name: { type: "string", example: "Background Music" },
          type: { type: "string", enum: ["audio"], example: "audio" },
          elements: {
            type: "array",
            items: { $ref: "#/components/schemas/AudioElement" }
          },
          muted: { type: "boolean", default: false, example: false }
        }
      },
      TextTrack: {
        type: "object",
        required: ["id", "name", "type", "elements"],
        properties: {
          id: { type: "string", example: "track-text-1" },
          name: { type: "string", example: "Subtitle Track" },
          type: { type: "string", enum: ["text"], example: "text" },
          elements: {
            type: "array",
            items: { $ref: "#/components/schemas/TextElement" }
          },
          hidden: { type: "boolean", default: false, example: false }
        }
      }
    }
  }
};

const CDN_BASE = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5";

export function renderSwaggerUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Video Rendering Server API Documentation</title>
  <link rel="stylesheet" type="text/css" href="${CDN_BASE}/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN_BASE}/swagger-ui-bundle.js"></script>
  <script src="${CDN_BASE}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset,
        ],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`;
}
