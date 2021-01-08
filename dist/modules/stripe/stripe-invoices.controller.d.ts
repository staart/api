import Stripe from 'stripe';
import { StripeService } from './stripe.service';
export declare class StripeInvoicesController {
    private stripeService;
    constructor(stripeService: StripeService);
    getAll(groupId: number, take?: number, cursor?: {
        id: string;
    }): Promise<Stripe.Invoice[]>;
    get(groupId: number, id: string): Promise<Stripe.Invoice>;
}
