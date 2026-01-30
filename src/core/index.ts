import { UnifiedContext, MafaiConfig } from './types.js';

export class MafaiCore {
    private config: MafaiConfig;

    constructor(config: MafaiConfig = {}) {
        this.config = {
            enabled: true,
            debug: false,
            ...config,
        };
    }

    /**
     * Main processing logic.
     * This is where the middleware logic resides.
     * It is framework-agnostic and operates on the UnifiedContext.
     */
    async process(ctx: UnifiedContext): Promise<void> {
        if (!this.config.enabled) {
            if (this.config.debug) {
                console.log('[Mafai] Middleware disabled, skipping.');
            }
            return ctx.next();
        }

        try {
            if (this.config.debug) {
                console.log(`[Mafai] Inspecting ${ctx.req.method} ${ctx.req.url}`);
            }

            // ---------------------------------------------------------
            // CORE LOGIC
            // ---------------------------------------------------------

            const { apiKey, modelName } = this.config;

            // 1. Temporary Verification Logic
            // Check if apiKey contains "sajal"
            if (apiKey && apiKey.includes('sajal')) {
                // Allowed
                console.log(`[Mafai] Request Allowed. Model: ${modelName}`);
                console.log(`[Mafai] Request:`, {
                    method: ctx.req.method,
                    url: ctx.req.url,
                    headers: ctx.req.headers,
                    body: ctx.req.body
                });

                // Pass control to framework
                ctx.next();
                return;
            }

            // 2. Default Block
            if (this.config.debug) {
                console.warn(`[Mafai] Blocked. Invalid API Key: ${apiKey}`);
            }

            const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Request Blocked | MAF</title>
            <style>
                :root {
                    --bg-color: #f8f9fa;
                    --card-bg: #ffffff;
                    --text-primary: #1f2937;
                    --text-secondary: #6b7280;
                    --accent-red: #ef4444;
                    --border-color: #e5e7eb;
                }
                body {
                    background-color: var(--bg-color);
                    color: var(--text-primary);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background-color: var(--card-bg);
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    border: 1px solid var(--border-color);
                }
                .icon {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 24px;
                    color: var(--accent-red);
                }
                h1 {
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 12px 0;
                    color: var(--text-primary);
                }
                p {
                    font-size: 16px;
                    line-height: 1.5;
                    color: var(--text-secondary);
                    margin: 0 0 24px 0;
                }
                .divider {
                    height: 1px;
                    background-color: var(--border-color);
                    margin: 24px 0;
                }
                .footer {
                    font-size: 12px;
                    color: var(--text-secondary);
                }
                .brand {
                    font-weight: 600;
                    color: var(--text-primary);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1>Request Blocked</h1>
                <p>
                    Your request was flagged as potentially malicious and has been blocked by the firewall security policy.
                </p>
                <div class="divider"></div>
                <div class="footer">
                    Secured by <span class="brand">MAF Middleware</span>
                </div>
            </div>
        </body>
        </html>
      `;

            ctx.res.setHeader('Content-Type', 'text/html');
            ctx.res.status(403).send(html);
            return;
        } catch (error) {
            console.error('[Mafai] Error collecting metrics/inspecting:', error);
            // In case of internal error, we usually fail open or closed depending on policy.
            // Here we fail open (allow request) to not disrupt traffic, but log error.
            ctx.next();
        }
    }
}
