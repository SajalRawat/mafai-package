import type { FastifyRequest, FastifyReply } from 'fastify';
import { MafaiConfig } from '../core/types.js';
/**
 * Fastify adapter for Mafai.
 * Usage:
 * fastify.addHook('onRequest', mafaiFastify({ ...config }));
 */
export declare const mafaiFastify: (config?: MafaiConfig) => (req: FastifyRequest, reply: FastifyReply, done: (err?: any) => void) => void;
//# sourceMappingURL=fastify.d.ts.map