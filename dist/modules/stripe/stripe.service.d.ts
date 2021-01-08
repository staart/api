/// <reference types="node" />
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class StripeService {
    private configService;
    private prisma;
    stripe: Stripe;
    logger: Logger;
    private metaConfig;
    private paymentsConfig;
    constructor(configService: ConfigService, prisma: PrismaService);
    createCustomer(groupId: number, data: Stripe.CustomerCreateParams): Promise<Stripe.Response<Stripe.Customer>>;
    getCustomer(groupId: number): Promise<Stripe.Response<Stripe.Customer>>;
    updateCustomer(groupId: number, data: Stripe.CustomerUpdateParams): Promise<Stripe.Response<Stripe.Customer>>;
    deleteCustomer(groupId: number): Promise<Stripe.DeletedCustomer>;
    getBillingPortalLink(groupId: number): Promise<Stripe.Response<Stripe.BillingPortal.Session>>;
    getInvoices(groupId: number, params: {
        take?: number;
        cursor?: {
            id: string;
        };
    }): Promise<Stripe.Invoice[]>;
    getInvoice(groupId: number, invoiceId: string): Promise<Stripe.Invoice>;
    getSubscriptions(groupId: number, params: {
        take?: number;
        cursor?: {
            id: string;
        };
    }): Promise<Stripe.Subscription[]>;
    getSubscription(groupId: number, subscriptionId: string): Promise<Stripe.Subscription>;
    getSources(groupId: number, params: {
        take?: number;
        cursor?: {
            id: string;
        };
    }): Promise<Stripe.CustomerSource[]>;
    getSource(groupId: number, sourceId: string): Promise<Stripe.Source>;
    deleteSource(groupId: number, sourceId: string): Promise<void>;
    createSession(groupId: number, mode: Stripe.Checkout.SessionCreateParams.Mode, planId?: string): Promise<Stripe.Checkout.Session>;
    cancelSubscription(groupId: number, subscriptionId: string): Promise<Stripe.Subscription>;
    plans(groupId: number, product?: string): Promise<Stripe.Plan[]>;
    handleWebhook(signature: string, payload: Buffer): Promise<{
        received: true;
    }>;
    private list;
    private stripeId;
}
