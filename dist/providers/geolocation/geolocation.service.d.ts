import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CityResponse } from 'maxmind';
export declare class GeolocationService implements OnModuleDestroy {
    private configService;
    constructor(configService: ConfigService);
    private lookup;
    private lru;
    onModuleDestroy(): void;
    getLocation(ipAddress: string): Promise<Partial<CityResponse>>;
    private getSafeLocation;
    private getUnsafeLocation;
}
