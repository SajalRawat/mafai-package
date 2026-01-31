import { UnifiedContext, MafaiConfig } from './types.js';
export declare class MafaiCore {
    private config;
    private engineUrl;
    constructor(config?: MafaiConfig);
    private analyzeRequestWithRegex;
    /**
     * Main processing logic.
     * Framework-agnostic, Fail-open by default.
     */
    process(ctx: UnifiedContext): Promise<void>;
    private sendToEngine;
    private blockRequest;
}
//# sourceMappingURL=index.d.ts.map