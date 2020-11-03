import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  groups,
  groupsCreateInput,
  groupsOrderByInput,
  groupsUpdateInput,
  groupsWhereInput,
  groupsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import randomColor from 'randomcolor';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(
    userId: number,
    data: Omit<Omit<groupsCreateInput, 'group'>, 'user'>,
  ): Promise<groups> {
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

  async getGroup(id: number): Promise<Expose<groups>> {
    const group = await this.prisma.groups.findOne({
      where: { id },
    });
    if (!group)
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<groups>(group);
  }

  async updateGroup(
    id: number,
    data: groupsUpdateInput,
  ): Promise<Expose<groups>> {
    const testGroup = await this.prisma.groups.findOne({
      where: { id },
    });
    if (!testGroup)
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
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
    if (!testGroup)
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
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
    if (!testGroup)
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    const group = await this.prisma.groups.delete({
      where: { id },
    });
    return this.prisma.expose<groups>(group);
  }
}
