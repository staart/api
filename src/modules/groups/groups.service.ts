import { Injectable, NotFoundException } from '@nestjs/common';
import {
  groups,
  groupsCreateInput,
  groupsOrderByInput,
  groupsUpdateInput,
  groupsWhereInput,
  groupsWhereUniqueInput,
} from '@prisma/client';
import randomColor from 'randomcolor';
import { GROUP_NOT_FOUND } from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(
    userId: number,
    data: Omit<Omit<groupsCreateInput, 'group'>, 'user'>,
  ) {
    let initials = data.name.trim().substr(0, 2).toUpperCase();
    if (data.name.includes(' '))
      initials = data.name
        .split(' ')
        .map((i) => i.trim().substr(0, 1))
        .join('')
        .toUpperCase();
    data.profilePictureUrl =
      data.profilePictureUrl ??
      `https://ui-avatars.com/api/?name=${initials}&background=${randomColor({
        luminosity: 'light',
      })}&color=000000`;
    return this.prisma.groups.create({
      include: { memberships: { include: { group: true } } },
      data: {
        ...data,
        memberships: {
          create: { role: 'OWNER', user: { connect: { id: userId } } },
        },
      },
    });
  }

  async getGroups(params: {
    skip?: number;
    take?: number;
    cursor?: groupsWhereUniqueInput;
    where?: groupsWhereInput;
    orderBy?: groupsOrderByInput;
  }): Promise<Expose<groups>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const groups = await this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return groups.map((user) => this.prisma.expose<groups>(user));
  }

  async getGroup(
    id: number,
    {
      select,
      include,
    }: {
      select?: Record<string, boolean>;
      include?: Record<string, boolean>;
    },
  ): Promise<Expose<groups>> {
    const group = await this.prisma.groups.findOne({
      where: { id },
      select,
      include,
    } as any);
    if (!group) throw new NotFoundException(GROUP_NOT_FOUND);
    return this.prisma.expose<groups>(group);
  }

  async updateGroup(
    id: number,
    data: groupsUpdateInput,
  ): Promise<Expose<groups>> {
    const testGroup = await this.prisma.groups.findOne({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.groups.update({
      where: { id },
      data,
    });
    return this.prisma.expose<groups>(group);
  }

  async replaceGroup(
    id: number,
    data: groupsCreateInput,
  ): Promise<Expose<groups>> {
    const testGroup = await this.prisma.groups.findOne({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.groups.update({
      where: { id },
      data,
    });
    return this.prisma.expose<groups>(group);
  }

  async deleteGroup(id: number): Promise<Expose<groups>> {
    const testGroup = await this.prisma.groups.findOne({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.groups.delete({
      where: { id },
    });
    return this.prisma.expose<groups>(group);
  }

  async getSubgroups(
    id: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: groupsWhereUniqueInput;
      where?: groupsWhereInput;
      orderBy?: groupsOrderByInput;
    },
  ): Promise<Expose<groups>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const groups = await this.prisma.groups.findMany({
      skip,
      take,
      cursor,
      where: { ...where, parent: { id } },
      orderBy,
    });
    return groups.map((user) => this.prisma.expose<groups>(user));
  }
}
