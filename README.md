# MAF (Model Application Firewall)

A plug-and-play, framework-agnostic request gatekeeper for Node.js applications. **mafai** combines local heuristic analysis with a powerful AI-driven engine to detect and block malicious traffic (SQL Injection, XSS, Path Traversal, and more) in real-time.

## Features

- **🛡️ Hybrid Analysis**: 
  - **Local Regex**: Instantly blocks common patterns (SQLi, XSS) for GET requests with zero latency penalty.
  - **AI Engine**: Offloads complex analysis for non-GET requests (POST, PUT, etc.) to the MAF Engine.
- **🚀 Fail-Open Design**: Built to *never* crash your application. If the security engine is unreachable or fails, the request is allowed to proceed (safe by default).
- **🔌 Framework Agnostic**: First-class adapters for **Express**, **Fastify**, and **Next.js**.
- **⚡ Zero Performance Impact**: GET requests are analyzed locally. Async logging ensures your traffic isn't bottlenecked.

## Installation

```bash
npm install mafai
```

## Usage

### Express

```typescript
import express from 'express';
import { mafaiExpress } from 'mafai';

const app = express();

app.use(express.json());

// Add MAF Middleware
app.use(mafaiExpress({
  apiKey: "YOUR_API_KEY", // Required for the MAF Engine
  debug: true // Optional: Enable detailed logs
}));

app.get('/', (req, res) => {
  res.send('Secure Content');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Fastify

```typescript
import Fastify from 'fastify';
import { mafaiFastify } from 'mafai';

const fastify = Fastify();

// Register as a global hook
fastify.addHook('onRequest', mafaiFastify({
  apiKey: "YOUR_API_KEY",
  enabled: true
}));

fastify.get('/', async () => {
  return { status: 'secure' };
});

fastify.listen({ port: 3000 });
```

### Next.js (API Routes)

Wrap your API handlers with `withMafai`.

```typescript
// pages/api/secure-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withMafai } from 'mafai';

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ name: 'John Doe', secret: '12345' });
};

export default withMafai(handler, {
  apiKey: "YOUR_API_KEY"
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `undefined` | **Required**. Your MAF Engine API Key. |
| `enabled` | `boolean` | `true` | Master switch to enable/disable the middleware. |
| `debug` | `boolean` | `false` | Enable verbose logging for debugging decisions. |
| `engineUrl` | `string` | `http://localhost:3001/evaluate` | URL of the MAF Decision Engine. Use this if you are self-hosting the engine. |

## How It Works

1.  **Incoming Request**: The middleware intercepts the request.
2.  **GET Requests**:
    *   Scanned locally against a highly-optimized set of Regex patterns for SQLi, XSS, and Traversal.
    *   **Verdict**: If a match is found, the request is **BLOCKED** immediately.
    *   **Logging**: The request metadata is asynchronously sent to the engine for telemetry (fire-and-forget).
3.  **Other Requests (POST, PUT, DELETE, etc.)**:
    *   Payload is constructed and sent to the **MAF Engine**.
    *   **Verdict**: The Engine analyzes the payload and returns a decision (`ALLOW` or `BLOCK`).
    *   If the Engine blocks, the specific blocked page is rendered.
4.  **Fail-Safe**: If any internal error occurs (e.g., Engine timeout), MAF catches the error and calls `next()`, ensuring your app remains available.

## License

MIT
