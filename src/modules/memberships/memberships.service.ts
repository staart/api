import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  groupsCreateInput,
  memberships,
  membershipsOrderByInput,
  membershipsUpdateInput,
  membershipsWhereInput,
  membershipsWhereUniqueInput,
  users,
} from '@prisma/client';
import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_DELETE_SOLE_OWNER,
  CANNOT_UPDATE_ROLE_SOLE_OWNER,
  MEMBERSHIP_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { safeEmail } from '../../helpers/safe-email';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { CreateMembershipInput } from './memberships.interface';

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private email: MailService,
    private configService: ConfigService,
    private groupsService: GroupsService,
  ) {}

  async getMemberships(params: {
    skip?: number;
    take?: number;
    cursor?: membershipsWhereUniqueInput;
    where?: membershipsWhereInput;
    orderBy?: membershipsOrderByInput;
  }): Promise<Expose<memberships>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const memberships = await this.prisma.memberships.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { group: true, user: true },
    });
    return memberships.map((user) => this.prisma.expose<memberships>(user));
  }

  async getUserMembership(
    userId: number,
    id: number,
  ): Promise<Expose<memberships>> {
    const membership = await this.prisma.memberships.findOne({
      where: { id },
      include: { group: true },
    });
    if (!membership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (membership.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<memberships>(membership);
  }

  async getGroupMembership(
    groupId: number,
    id: number,
  ): Promise<Expose<memberships>> {
    const membership = await this.prisma.memberships.findOne({
      where: { id },
      include: { user: true },
    });
    if (!membership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (membership.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<memberships>(membership);
  }

  async deleteUserMembership(
    userId: number,
    id: number,
  ): Promise<Expose<memberships>> {
    const testMembership = await this.prisma.memberships.findOne({
      where: { id },
    });
    if (!testMembership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (testMembership.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    await this.verifyDeleteMembership(testMembership.groupId, id);
    const membership = await this.prisma.memberships.delete({
      where: { id },
    });
    return this.prisma.expose<memberships>(membership);
  }

  async updateGroupMembership(
    groupId: number,
    id: number,
    data: membershipsUpdateInput,
  ): Promise<Expose<memberships>> {
    const testMembership = await this.prisma.memberships.findOne({
      where: { id },
    });
    if (!testMembership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (testMembership.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (testMembership.role === 'OWNER' && data.role !== 'OWNER') {
      const otherOwners = (
        await this.prisma.memberships.findMany({
          where: { group: { id: groupId }, role: 'OWNER' },
        })
      ).filter((i) => i.id !== id);
      if (!otherOwners.length)
        throw new BadRequestException(CANNOT_UPDATE_ROLE_SOLE_OWNER);
    }
    const membership = await this.prisma.memberships.update({
      where: { id },
      data,
      include: { user: true },
    });
    return this.prisma.expose<memberships>(membership);
  }

  async deleteGroupMembership(
    groupId: number,
    id: number,
  ): Promise<Expose<memberships>> {
    const testMembership = await this.prisma.memberships.findOne({
      where: { id },
    });
    if (!testMembership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (testMembership.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    await this.verifyDeleteMembership(testMembership.groupId, id);
    const membership = await this.prisma.memberships.delete({
      where: { id },
      include: { user: true },
    });
    return this.prisma.expose<memberships>(membership);
  }

  async createUserMembership(userId: number, data: groupsCreateInput) {
    const created = await this.groupsService.createGroup(userId, data);
    return created.memberships[0];
  }

  async createGroupMembership(
    ipAddress: string,
    groupId: number,
    data: CreateMembershipInput,
  ) {
    const emailSafe = safeEmail(data.email);
    const userResult = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
    });
    let user: Expose<users> | null = userResult
      ? this.prisma.expose<users>(userResult)
      : null;
    if (!user)
      user = await this.auth.register(ipAddress, { name: data.email, ...data });
    const result = await this.prisma.memberships.create({
      data: {
        role: data.role,
        group: { connect: { id: groupId } },
        user: { connect: { id: user.id } },
      },
      include: { group: { select: { name: true } } },
    });
    this.email.send({
      to: `"${user.name}" <${data.email}>`,
      template: 'groups/invitation',
      data: {
        name: user.name,
        group: result.group.name,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/groups/${groupId}`,
      },
    });
    return this.prisma.expose<memberships>(result);
  }

  /** Verify whether a group membership can be deleted */
  private async verifyDeleteMembership(
    groupId: number,
    membershipId: number,
  ): Promise<void> {
    const memberships = await this.prisma.memberships.findMany({
      where: { group: { id: groupId } },
    });
    if (memberships.length === 1)
      throw new BadRequestException(CANNOT_DELETE_SOLE_MEMBER);
    const membership = await this.prisma.memberships.findOne({
      where: { id: membershipId },
    });
    if (!membership) throw new NotFoundException(MEMBERSHIP_NOT_FOUND);
    if (
      membership.role === 'OWNER' &&
      memberships.filter((i) => i.role === 'OWNER').length === 1
    )
      throw new BadRequestException(CANNOT_DELETE_SOLE_OWNER);
  }
}
