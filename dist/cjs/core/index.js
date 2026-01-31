"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MafaiCore = void 0;
// Default Engine URL if not provided by config or env
const DEFAULT_ENGINE_URL = 'http://localhost:3001/evaluate';
class MafaiCore {
    constructor(config = {}) {
        this.config = {
            enabled: true,
            debug: false,
            ...config,
        };
        // Resolve Engine URL: Config -> Env -> Default
        this.engineUrl =
            this.config.engineUrl ||
                process.env.MAF_ENGINE_URL ||
                DEFAULT_ENGINE_URL;
        if (this.config.debug) {
            console.log(`[Mafai] Using Engine URL: ${this.engineUrl}`);
        }
    }
    /**
     * Main processing logic.
     * Framework-agnostic, Fail-open by default.
     */
    async process(ctx) {
        // Fail-Open/Closed helper
        const handleFailure = (errorMsg, internalError) => {
            if (this.config.debug) {
                console.error(`[Mafai] ${errorMsg}:`, internalError || '');
            }
            if (this.config.failStrategy === 'closed') {
                return this.blockRequest(ctx, 'Engine Unavailable', 'The security engine is currently unreachable. Access is restricted for safety.');
            }
            return ctx.next();
        };
        try {
            // 1. Check if enabled
            if (this.config.enabled === false) {
                if (this.config.debug)
                    console.log('[Mafai] Disabled, skipping.');
                return ctx.next();
            }
            // 2. Normalize Request
            const { method, url, headers, ip } = ctx.req;
            // 3. Build GET Query Params (Headers summary: count + common keys)
            const headerKeys = Object.keys(headers);
            const headersSummary = `${headerKeys.length} headers (${headerKeys.slice(0, 3).join(',')}...)`;
            const queryParams = new URLSearchParams({
                token: this.config.apiKey || '',
                ip: ip || 'unknown',
                method,
                path: url,
                headers: headersSummary
            });
            const engineEndpoint = `${this.engineUrl}?${queryParams.toString()}`;
            if (this.config.debug) {
                console.log(`[Mafai] Verifying request via GET: ${engineEndpoint}`);
            }
            // 4. Send to Engine with Timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            let response;
            try {
                response = await fetch(engineEndpoint, {
                    method: 'GET',
                    signal: controller.signal
                });
            }
            catch (err) {
                clearTimeout(timeoutId);
                return handleFailure('Engine Communication Error', err);
            }
            clearTimeout(timeoutId);
            if (!response.ok) {
                return handleFailure(`Engine returned status ${response.status}`);
            }
            let data;
            try {
                data = await response.json();
            }
            catch (err) {
                return handleFailure('Invalid JSON from Engine', err);
            }
            // 5. Enforce Decision
            const isAllowed = (data === null || data === void 0 ? void 0 : data.allow) === true;
            const reason = data === null || data === void 0 ? void 0 : data.reason;
            if (!isAllowed) {
                if (this.config.debug)
                    console.warn(`[Mafai] Request Blocked. Reason: ${reason || 'Decision Engine'}`);
                let title = 'Request Blocked';
                let message = 'Your request was flagged as potentially malicious and has been blocked by the firewall security policy.';
                if (reason === 'invalid_token') {
                    title = 'Authentication Error';
                    message = 'The application token provided is invalid or expired. Access denied.';
                }
                return this.blockRequest(ctx, title, message);
            }
            // Implicitly allowed
            if (this.config.debug)
                console.log('[Mafai] Request Allowed.');
            return ctx.next();
        }
        catch (error) {
            return handleFailure('Unexpected Internal Error', error);
        }
    }
    blockRequest(ctx, title, message) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | MAF</title>
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
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="divider"></div>
        <div class="footer">
            Secured by <span class="brand">MAF Middleware</span>
        </div>
    </div>
</body>
</html>`;
        ctx.res.setHeader('Content-Type', 'text/html');
        ctx.res.status(403).send(html);
    }
}
exports.MafaiCore = MafaiCore;
