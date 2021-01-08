import Stripe from 'stripe';
import { StripeService } from './stripe.service';
export declare class StripeSourcesController {
    private stripeService;
    constructor(stripeService: StripeService);
    create(groupId: number): Promise<Stripe.Checkout.Session>;
    getAll(groupId: number, take?: number, cursor?: {
        id: string;
    }): Promise<Stripe.CustomerSource[]>;
    get(groupId: number, id: string): Promise<Stripe.Source>;
    remove(groupId: number, id: string): Promise<void>;
}
