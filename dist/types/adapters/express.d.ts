import type { Request, Response, NextFunction } from 'express';
import { MafaiConfig } from '../core/types.js';
/**
 * Express adapter for Mafai.
 * Usage:
 * app.use(mafaiExpress({ ...config }));
 */
export declare const mafaiExpress: (config?: MafaiConfig) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=express.d.ts.map