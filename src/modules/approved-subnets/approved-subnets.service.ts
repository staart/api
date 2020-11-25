import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { ApprovedSubnet } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import anonymize from 'ip-anonymize';
import {
  APPROVED_SUBNET_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { GeolocationService } from '../../providers/geolocation/geolocation.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class ApprovedSubnetsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private geolocationService: GeolocationService,
  ) {}

  async getApprovedSubnets(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ApprovedSubnetWhereUniqueInput;
      where?: Prisma.ApprovedSubnetWhereInput;
      orderBy?: Prisma.ApprovedSubnetOrderByInput;
    },
  ): Promise<Expose<ApprovedSubnet>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const ApprovedSubnet = await this.prisma.approvedSubnet.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return ApprovedSubnet.map((user) =>
      this.prisma.expose<ApprovedSubnet>(user),
    );
  }

  async getApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<ApprovedSubnet>> {
    const ApprovedSubnet = await this.prisma.approvedSubnet.findUnique({
      where: { id },
    });
    if (!ApprovedSubnet) throw new NotFoundException(APPROVED_SUBNET_NOT_FOUND);
    if (ApprovedSubnet.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (!ApprovedSubnet) throw new NotFoundException(APPROVED_SUBNET_NOT_FOUND);
    return this.prisma.expose<ApprovedSubnet>(ApprovedSubnet);
  }

  async deleteApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<ApprovedSubnet>> {
    const testApprovedSubnet = await this.prisma.approvedSubnet.findUnique({
      where: { id },
    });
    if (!testApprovedSubnet)
      throw new NotFoundException(APPROVED_SUBNET_NOT_FOUND);
    if (testApprovedSubnet.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const ApprovedSubnet = await this.prisma.approvedSubnet.delete({
      where: { id },
    });
    return this.prisma.expose<ApprovedSubnet>(ApprovedSubnet);
  }

  async approveNewSubnet(userId: number, ipAddress: string) {
    const subnet = await hash(
      anonymize(ipAddress),
      this.configService.get<number>('security.saltRounds') ?? 10,
    );
    const location = await this.geolocationService.getLocation(ipAddress);
    const approved = await this.prisma.approvedSubnet.create({
      data: {
        user: { connect: { id: userId } },
        subnet,
        city: location?.city?.names?.en,
        region: location?.subdivisions?.pop()?.names?.en,
        timezone: location?.location?.time_zone,
        countryCode: location?.country?.iso_code,
      },
    });
    return this.prisma.expose<ApprovedSubnet>(approved);
  }

  /**
   * Upsert a new subnet
   * If this subnet already exists, skip; otherwise add it
   */
  async upsertNewSubnet(
    userId: number,
    ipAddress: string,
  ): Promise<Expose<ApprovedSubnet>> {
    const subnet = anonymize(ipAddress);
    const previousSubnets = await this.prisma.approvedSubnet.findMany({
      where: { user: { id: userId } },
    });
    for await (const item of previousSubnets) {
      if (await compare(subnet, item.subnet))
        return this.prisma.expose<ApprovedSubnet>(item);
    }
    return this.approveNewSubnet(userId, ipAddress);
  }
}
