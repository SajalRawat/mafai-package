import type { NextApiRequest, NextApiResponse } from 'next';
import { MafaiConfig } from '../core/types.js';
/**
 * Next.js API Route adapter for Mafai.
 * Usage:
 * export default withMafai(handler, { ...config });
 */
export declare const withMafai: (handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>, config?: MafaiConfig) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
//# sourceMappingURL=next-api.d.ts.map