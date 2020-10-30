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

@Injectable()
export class ApprovedSubnetsService {
  constructor(private prisma: PrismaService) {}
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
    const subnet = anonymize(ipAddress);
    const approved = await this.prisma.approvedSubnets.create({
      data: {
        user: { connect: { id: userId } },
        subnet,
        createdAt: new Date(),
      },
    });
    return this.prisma.expose<approvedSubnets>(approved);
  }
}
