# Mafai

A framework-agnostic, production-ready Request Gatekeeper and Middleware for Node.js.

## Installation

```bash
npm install mafai
```

## Basic Usage

### Express Example

```typescript
import express from 'express';
import { mafaiExpress } from 'mafai';

const app = express();

app.use(express.json()); // Body parser is recommended

// Initialize Mafai with your credentials
app.use(mafaiExpress({
  enabled: true,
  apiKey: "my-sajal-secret-key", // must contain 'sajal' for now
  modelName: "gpt-4-turbo"
}));

app.get('/', (req, res) => {
  res.send('Welcome! You have a valid key.');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Fastify Example

```typescript
import Fastify from 'fastify';
import { mafaiFastify } from 'mafai';

const fastify = Fastify();

fastify.addHook('onRequest', mafaiFastify({
  enabled: true,
  apiKey: "super-sajal-key",
  modelName: "claude-3-opus"
}));

fastify.get('/', async () => {
  return { status: 'authorized' };
});

fastify.listen({ port: 3000 });
```

### Next.js API Example

```typescript
// pages/api/data.ts
import { withMafai } from 'mafai';

const handler = (req, res) => {
  res.status(200).json({ data: 'Secret Data' });
};

export default withMafai(handler, {
  apiKey: "sajal-verification-key",
  modelName: "gemini-pro"
});
```

## Configuration

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | **Required.** Your authentication key. Must contain "sajal" to pass. |
| `modelName`| `string` | **Required.** Name of the model being used. |
| `enabled` | `boolean` | Enable/Disable the middleware. Default: `true` |
| `debug` | `boolean` | Enable debug logs. Default: `false` |
