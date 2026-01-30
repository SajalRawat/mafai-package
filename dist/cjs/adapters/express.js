"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mafaiExpress = void 0;
const index_js_1 = require("../core/index.js");
/**
 * Express adapter for Mafai.
 * Usage:
 * app.use(mafaiExpress({ ...config }));
 */
const mafaiExpress = (config) => {
    const core = new index_js_1.MafaiCore(config);
    return (req, res, next) => {
        const context = {
            req: {
                headers: req.headers,
                method: req.method,
                url: req.originalUrl || req.url,
                body: req.body,
                query: req.query,
                ip: req.ip,
                params: req.params,
            },
            res: {
                status: (code) => {
                    res.status(code);
                    return context.res;
                },
                send: (body) => {
                    res.send(body);
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
                next(err);
            }
        };
        // Execute core logic
        core.process(context).catch((err) => {
            // Should catch unexpected errors in core
            next(err);
        });
    };
};
exports.mafaiExpress = mafaiExpress;
