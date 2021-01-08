declare class Address {
    line1: string;
    city?: string;
    country?: string;
    line2?: string;
    postal_code?: string;
    state?: string;
}
export declare class CreateBillingDto {
    email: string;
    name: string;
    phone?: string;
    promotion_code?: string;
    address?: Address;
}
export declare class UpdateBillingDto {
    default_source?: string;
    email?: string;
    name?: string;
    phone?: string;
    promotion_code?: string;
    address?: Address;
}
export declare class ReplaceBillingDto {
    email: string;
    name: string;
    phone: string;
    address: Address;
}
export {};
