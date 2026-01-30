import { UnifiedContext, MafaiConfig } from './types.js';
export declare class MafaiCore {
    private config;
    constructor(config?: MafaiConfig);
    /**
     * Main processing logic.
     * This is where the middleware logic resides.
     * It is framework-agnostic and operates on the UnifiedContext.
     */
    process(ctx: UnifiedContext): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map