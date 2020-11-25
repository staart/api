import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Session } from '@prisma/client';
import {
  SESSION_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}
  async getSessions(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.SessionWhereUniqueInput;
      where?: Prisma.SessionWhereInput;
      orderBy?: Prisma.SessionOrderByInput;
    },
  ): Promise<Expose<Session>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const sessions = await this.prisma.session.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return sessions.map((user) => this.prisma.expose<Session>(user));
  }

  async getSession(userId: number, id: number): Promise<Expose<Session>> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    if (session.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    return this.prisma.expose<Session>(session);
  }

  async deleteSession(userId: number, id: number): Promise<Expose<Session>> {
    const testSession = await this.prisma.session.findUnique({
      where: { id },
    });
    if (!testSession) throw new NotFoundException(SESSION_NOT_FOUND);
    if (testSession.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const session = await this.prisma.session.delete({
      where: { id },
    });
    return this.prisma.expose<Session>(session);
  }
}
