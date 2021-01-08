/// <reference types="node" />
import { StripeService } from './stripe.service';
export declare class StripeWebhookController {
    private stripeService;
    constructor(stripeService: StripeService);
    handleWebhook(signature: string, raw: Buffer): Promise<{
        received: true;
    }>;
}
