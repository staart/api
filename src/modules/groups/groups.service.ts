import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Group } from '@prisma/client';
import randomColor from 'randomcolor';
import { GROUP_NOT_FOUND } from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(
    userId: number,
    data: Omit<Omit<Prisma.GroupCreateInput, 'group'>, 'user'>,
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
    return this.prisma.group.create({
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
    cursor?: Prisma.GroupWhereUniqueInput;
    where?: Prisma.GroupWhereInput;
    orderBy?: Prisma.GroupOrderByInput;
  }): Promise<Expose<Group>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const groups = await this.prisma.group.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return groups.map((user) => this.prisma.expose<Group>(user));
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
  ): Promise<Expose<Group>> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      select,
      include,
    } as any);
    if (!group) throw new NotFoundException(GROUP_NOT_FOUND);
    return this.prisma.expose<Group>(group);
  }

  async updateGroup(
    id: number,
    data: Prisma.GroupUpdateInput,
  ): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.group.update({
      where: { id },
      data,
    });
    return this.prisma.expose<Group>(group);
  }

  async replaceGroup(
    id: number,
    data: Prisma.GroupCreateInput,
  ): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.group.update({
      where: { id },
      data,
    });
    return this.prisma.expose<Group>(group);
  }

  async deleteGroup(id: number): Promise<Expose<Group>> {
    const testGroup = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!testGroup) throw new NotFoundException(GROUP_NOT_FOUND);
    const group = await this.prisma.group.delete({
      where: { id },
    });
    return this.prisma.expose<Group>(group);
  }

  async getSubgroups(
    id: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.GroupWhereUniqueInput;
      where?: Prisma.GroupWhereInput;
      orderBy?: Prisma.GroupOrderByInput;
    },
  ): Promise<Expose<Group>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const groups = await this.prisma.group.findMany({
      skip,
      take,
      cursor,
      where: { ...where, parent: { id } },
      orderBy,
    });
    return groups.map((user) => this.prisma.expose<Group>(user));
  }
}
