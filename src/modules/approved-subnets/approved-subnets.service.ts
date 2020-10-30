import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  approvedLocations,
  approvedLocationsOrderByInput,
  approvedLocationsWhereInput,
  approvedLocationsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovedSubnetsService {
  constructor(private prisma: PrismaService) {}
  async getApprovedSubnets(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: approvedLocationsWhereUniqueInput;
      where?: approvedLocationsWhereInput;
      orderBy?: approvedLocationsOrderByInput;
    },
  ): Promise<Expose<approvedLocations>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const approvedLocations = await this.prisma.approvedLocations.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return approvedLocations.map(user =>
      this.prisma.expose<approvedLocations>(user),
    );
  }

  async getApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<approvedLocations> | null> {
    const approvedLocation = await this.prisma.approvedLocations.findOne({
      where: { id },
    });
    if (!approvedLocation)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    if (approvedLocation.userId !== userId) throw new UnauthorizedException();
    if (!approvedLocation)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<approvedLocations>(approvedLocation);
  }

  async deleteApprovedSubnet(
    userId: number,
    id: number,
  ): Promise<Expose<approvedLocations>> {
    const testApprovedSubnet = await this.prisma.approvedLocations.findOne({
      where: { id },
    });
    if (!testApprovedSubnet)
      throw new HttpException('ApprovedSubnet not found', HttpStatus.NOT_FOUND);
    if (testApprovedSubnet.userId !== userId) throw new UnauthorizedException();
    const approvedLocation = await this.prisma.approvedLocations.delete({
      where: { id },
    });
    return this.prisma.expose<approvedLocations>(approvedLocation);
  }
}
