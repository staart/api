import { Client } from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';
export declare class GoogleMapsService {
    private configService;
    private logger;
    private config;
    client: Client;
    constructor(configService: ConfigService);
    autocomplete(query: string, components?: string[]): Promise<import("@googlemaps/google-maps-services-js").PlaceAutocompleteResponse>;
}
