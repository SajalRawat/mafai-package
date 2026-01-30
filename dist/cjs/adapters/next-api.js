"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMafai = void 0;
const index_js_1 = require("../core/index.js");
/**
 * Next.js API Route adapter for Mafai.
 * Usage:
 * export default withMafai(handler, { ...config });
 */
const withMafai = (handler, config) => {
    const core = new index_js_1.MafaiCore(config);
    return async (req, res) => {
        // We need to promisify the core middleware execution for Next.js API
        // because it doesn't have a native 'next' callback chain for this wrapper pattern usually.
        // However, we can simulate `next` by resolving a promise.
        const runMiddleware = () => new Promise((resolve, reject) => {
            const context = {
                req: {
                    headers: req.headers,
                    method: req.method || 'GET',
                    url: req.url || '/',
                    body: req.body,
                    query: req.query,
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    // NextApiRequest params are in query or need extraction, usually query has them.
                    params: req.query,
                },
                res: {
                    status: (code) => {
                        res.status(code);
                        return context.res;
                    },
                    send: (body) => {
                        res.send(body);
                        // If we send, we implicitly resolve/end, but we should let the handler know or stop?
                        // If core sends response (blocking), we should NOT call handler.
                        // But how to signal "stop"?
                        // If middleware sends response, the promise resolves, but we need to know IF we should continue.
                        // The UnifiedContext 'next' is what calls resolve.
                        // If 'next' is NOT called, we effectively hang or stop.
                    },
                    json: (body) => {
                        res.json(body);
                    },
                    setHeader: (key, value) => {
                        res.setHeader(key, value);
                    },
                    end: () => {
                        res.end();
                    }
                },
                next: (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                }
            };
            core.process(context).catch(reject);
        });
        try {
            // If runMiddleware resolves, it means `next()` was called => we proceed to handler.
            // If it stays pending (because response was sent and next not called), we await forever? 
            // No, core.process is async. If it finishes without calling next, we shouldn't necessarily hang, 
            // but in the wrapper pattern, we need to know if we should call handler.
            // Actually, if core blocks (sends response), it generally won't call next().
            // But we need to *wait* for valid processing.
            // If core returns *and* next wasn't called, it implies the request was handled/interrupted.
            // We can use a flag.
            let nextCalled = false;
            const context = {
                req: {
                    headers: req.headers,
                    method: req.method || 'GET',
                    url: req.url || '/',
                    body: req.body,
                    query: req.query,
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    params: req.query,
                },
                res: {
                    status: (code) => { res.status(code); return context.res; },
                    send: (body) => { res.send(body); },
                    json: (body) => { res.json(body); },
                    setHeader: (key, value) => { res.setHeader(key, value); },
                    end: () => { res.end(); },
                },
                next: (err) => {
                    if (err)
                        throw err;
                    nextCalled = true;
                }
            };
            await core.process(context);
            if (nextCalled) {
                return handler(req, res);
            }
            // If next not called, assume response sent by middleware.
        }
        catch (error) {
            console.error('Mafai Middleware Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
exports.withMafai = withMafai;
