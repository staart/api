import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { ApprovedSubnet } from '@prisma/client';
import { GeolocationService } from '../../providers/geolocation/geolocation.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class ApprovedSubnetsService {
    private prisma;
    private configService;
    private geolocationService;
    constructor(prisma: PrismaService, configService: ConfigService, geolocationService: GeolocationService);
    getApprovedSubnets(userId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ApprovedSubnetWhereUniqueInput;
        where?: Prisma.ApprovedSubnetWhereInput;
        orderBy?: Prisma.ApprovedSubnetOrderByInput;
    }): Promise<Expose<ApprovedSubnet>[]>;
    getApprovedSubnet(userId: number, id: number): Promise<Expose<ApprovedSubnet>>;
    deleteApprovedSubnet(userId: number, id: number): Promise<Expose<ApprovedSubnet>>;
    approveNewSubnet(userId: number, ipAddress: string): Promise<Pick<Pick<Pick<Pick<Pick<ApprovedSubnet, "id" | "countryCode" | "createdAt" | "timezone" | "updatedAt" | "userId" | "subnet" | "city" | "region">, "id" | "countryCode" | "createdAt" | "timezone" | "updatedAt" | "userId" | "subnet" | "city" | "region">, "id" | "countryCode" | "createdAt" | "timezone" | "updatedAt" | "userId" | "subnet" | "city" | "region">, "id" | "countryCode" | "createdAt" | "timezone" | "updatedAt" | "userId" | "subnet" | "city" | "region">, "id" | "countryCode" | "createdAt" | "timezone" | "updatedAt" | "userId" | "city" | "region">>;
    upsertNewSubnet(userId: number, ipAddress: string): Promise<Expose<ApprovedSubnet>>;
}
