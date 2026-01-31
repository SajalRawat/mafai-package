// Default Engine URL if not provided by config or env
const DEFAULT_ENGINE_URL = 'http://localhost:3001/evaluate';
export class MafaiCore {
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
        // Fail-Open: Wrap everything in a try-catch
        try {
            // 1. Check if enabled
            if (this.config.enabled === false) {
                if (this.config.debug)
                    console.log('[Mafai] Disabled, skipping.');
                return ctx.next();
            }
            // 2. Normalize Request
            const { method, url, headers, ip, body } = ctx.req;
            const cleanHeaders = { ...headers }; // Basic sanitization/copy
            // 3. GET Request Body Handling
            const isGet = /^(GET)$/i.test(method);
            // 4. Construct Engine Payload
            const payload = {
                token: this.config.apiKey || '',
                request: {
                    ip,
                    method,
                    path: url,
                    url,
                    headers: cleanHeaders,
                    body: ctx.req.body // Pass original body object, let engine handle it or JSON.stringify here
                }
            };
            if (this.config.debug) {
                console.log('[Mafai] Sending payload to engine:', JSON.stringify(payload, null, 2));
            }
            // 5. Send to Engine with Timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(this.engineUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (this.config.debug)
                    console.warn(`[Mafai] Engine returned ${response.status}. Failing open.`);
                return ctx.next();
            }
            const decisionData = await response.json();
            const decision = decisionData === null || decisionData === void 0 ? void 0 : decisionData.decision; // Expecting { decision: "YES" | "NO" }
            // 6. Enforce Decision
            if (decision === 'NO') {
                if (this.config.debug)
                    console.warn('[Mafai] Request Blocked by Engine.');
                return this.blockRequest(ctx);
            }
            // Implicitly decision === 'YES' or unknown
            if (this.config.debug)
                console.log('[Mafai] Request Allowed.');
            return ctx.next();
        }
        catch (error) {
            // FAIL-OPEN GUARANTEE
            if (this.config.debug) {
                console.error('[Mafai] Internal Error (Fail-Open):', error);
            }
            return ctx.next();
        }
    }
    blockRequest(ctx) {
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
</html>`;
        ctx.res.setHeader('Content-Type', 'text/html');
        ctx.res.status(403).send(html);
    }
}
