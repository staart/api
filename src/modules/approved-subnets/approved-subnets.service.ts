import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  approvedSubnets,
  approvedSubnetsOrderByInput,
  approvedSubnetsWhereInput,
  approvedSubnetsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import anonymize from 'ip-anonymize';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { GeolocationService } from '../geolocation/geolocation.service';

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
      cursor?: approvedSubnetsWhereUniqueInput;
      where?: approvedSubnetsWhereInput;
      orderBy?: approvedSubnetsOrderByInput;
    },
  ): Promise<Expose<approvedSubnets>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const approvedSubnets = await this.prisma.approvedSubnets.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return approvedSubnets.map(user =>
      this.prisma.expose<approvedSubnets>(user),
    );
  }

  async getApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<approvedSubnets> | null> {
    const approvedSubnet = await this.prisma.approvedSubnets.findOne({
      where: { id },
    });
    if (!approvedSubnet)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    if (approvedSubnet.userId !== userId) throw new UnauthorizedException();
    if (!approvedSubnet)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<approvedSubnets>(approvedSubnet);
  }

  async deleteApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<approvedSubnets>> {
    const testApprovedSubnet = await this.prisma.approvedSubnets.findOne({
      where: { id },
    });
    if (!testApprovedSubnet)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    if (testApprovedSubnet.userId !== userId) throw new UnauthorizedException();
    const approvedSubnet = await this.prisma.approvedSubnets.delete({
      where: { id },
    });
    return this.prisma.expose<approvedSubnets>(approvedSubnet);
  }

  async approveNewSubnet(userId: number, ipAddress: string) {
    const subnet = await hash(
      anonymize(ipAddress),
      this.configService.get<number>('security.saltRounds'),
    );
    const location = await this.geolocationService.getLocation(ipAddress);
    const approved = await this.prisma.approvedSubnets.create({
      data: {
        user: { connect: { id: userId } },
        subnet,
        city: location?.city?.names?.en,
        region: location?.subdivisions.pop()?.names?.en,
        timezone: location?.location?.time_zone,
        countryCode: location?.country?.iso_code,
      },
    });
    return this.prisma.expose<approvedSubnets>(approved);
  }

  /**
   * Upsert a new subnet
   * If this subnet already exists, skip; otherwise add it
   */
  async upsertNewSubnet(
    userId: number,
    ipAddress: string,
  ): Promise<Expose<approvedSubnets>> {
    const subnet = anonymize(ipAddress);
    const previousSubnets = await this.prisma.approvedSubnets.findMany({
      where: { user: { id: userId } },
    });
    for await (const item of previousSubnets) {
      if (await compare(subnet, item.subnet))
        return this.prisma.expose<approvedSubnets>(item);
    }
    return this.approveNewSubnet(userId, ipAddress);
  }
}
