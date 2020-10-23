import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  memberships,
  membershipsOrderByInput,
  membershipsWhereInput,
  membershipsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}
  async getMemberships(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: membershipsWhereUniqueInput;
      where?: membershipsWhereInput;
      orderBy?: membershipsOrderByInput;
    },
  ): Promise<Expose<memberships>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const memberships = await this.prisma.memberships.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
      include: { group: true },
    });
    return memberships.map(user => this.prisma.expose<memberships>(user));
  }

  async getMembership(
    userId: number,
    id: number,
  ): Promise<Expose<memberships> | null> {
    const membership = await this.prisma.memberships.findOne({
      where: { id },
      include: { group: true },
    });
    if (membership.userId !== userId) throw new UnauthorizedException();
    if (!membership)
      throw new HttpException('Membership not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<memberships>(membership);
  }

  async deleteMembership(
    userId: number,
    id: number,
  ): Promise<Expose<memberships>> {
    const testMembership = await this.prisma.memberships.findOne({
      where: { id },
    });
    if (testMembership.userId !== userId) throw new UnauthorizedException();
    await this.verifyDeleteMembership(testMembership.groupId, id);
    const membership = await this.prisma.memberships.delete({
      where: { id },
    });
    return this.prisma.expose<memberships>(membership);
  }

  /** Verify whether a group membership can be deleted */
  async verifyDeleteMembership(
    groupId: number,
    membershipId: number,
  ): Promise<void> {
    const memberships = await this.prisma.memberships.findMany({
      where: { group: { id: groupId } },
    });
    if (memberships.length === 1)
      throw new HttpException(
        'You cannot remove the sole member of a group',
        HttpStatus.BAD_REQUEST,
      );
    const membership = await this.prisma.memberships.findOne({
      where: { id: membershipId },
    });
    if (
      membership.role === 'OWNER' &&
      memberships.filter(i => i.role === 'OWNER').length === 1
    )
      throw new HttpException(
        'You cannot remove the sole owner of a group',
        HttpStatus.BAD_REQUEST,
      );
  }
}
