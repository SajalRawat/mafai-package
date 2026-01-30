"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mafaiFastify = void 0;
const index_js_1 = require("../core/index.js");
/**
 * Fastify adapter for Mafai.
 * Usage:
 * fastify.addHook('onRequest', mafaiFastify({ ...config }));
 */
const mafaiFastify = (config) => {
    const core = new index_js_1.MafaiCore(config);
    return (req, reply, done) => {
        // Fastify request/reply mapping
        const context = {
            req: {
                headers: req.headers,
                method: req.method,
                url: req.url,
                body: req.body,
                query: req.query,
                ip: req.ip,
                params: req.params,
            },
            res: {
                status: (code) => {
                    reply.code(code);
                    return context.res;
                },
                send: (body) => {
                    reply.send(body);
                },
                json: (body) => {
                    reply.send(body);
                },
                setHeader: (key, value) => {
                    reply.header(key, value);
                },
                end: () => {
                    // Fastify handles ending response via send usually, but we can try to facilitate
                    // Often not needed if send() is called. 
                    // If we must end without body:
                    if (!reply.sent)
                        reply.send();
                }
            },
            next: (err) => {
                done(err);
            }
        };
        core.process(context).catch(err => done(err));
    };
};
exports.mafaiFastify = mafaiFastify;
