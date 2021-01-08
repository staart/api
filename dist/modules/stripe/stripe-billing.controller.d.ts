import Stripe from 'stripe';
import { CreateBillingDto, ReplaceBillingDto, UpdateBillingDto } from './stripe.dto';
import { StripeService } from './stripe.service';
export declare class StripeBillingController {
    private stripeService;
    constructor(stripeService: StripeService);
    createBillingAccount(groupId: number, data: CreateBillingDto): Promise<Stripe.Customer>;
    getBillingAccount(groupId: number): Promise<Stripe.Customer>;
    updateBillingAccount(groupId: number, data: UpdateBillingDto): Promise<Stripe.Customer>;
    replaceBillingAccount(groupId: number, data: ReplaceBillingDto): Promise<Stripe.Customer>;
    deleteBillingAccount(groupId: number): Promise<Stripe.DeletedCustomer>;
    getSession(groupId: number): Promise<Stripe.Response<Stripe.BillingPortal.Session>>;
}
