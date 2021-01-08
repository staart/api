import Stripe from 'stripe';
import { StripeService } from './stripe.service';
export declare class StripeSubscriptionController {
    private stripeService;
    constructor(stripeService: StripeService);
    create(groupId: number, plan: string): Promise<Stripe.Checkout.Session>;
    getAll(groupId: number, take?: number, cursor?: {
        id: string;
    }): Promise<Stripe.Subscription[]>;
    get(groupId: number, id: string): Promise<Stripe.Subscription>;
    remove(groupId: number, id: string): Promise<Stripe.Subscription>;
    getPlans(groupId: number, product?: string): Promise<Stripe.Plan[]>;
}
