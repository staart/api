import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  sessions,
  sessionsOrderByInput,
  sessionsWhereInput,
  sessionsWhereUniqueInput,
} from '@prisma/client';
import {
  SESSION_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from 'src/errors/errors.constants';
import { Expose } from '../../modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}
  async getSessions(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: sessionsWhereUniqueInput;
      where?: sessionsWhereInput;
      orderBy?: sessionsOrderByInput;
    },
  ): Promise<Expose<sessions>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const sessions = await this.prisma.sessions.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return sessions.map((user) => this.prisma.expose<sessions>(user));
  }

  async getSession(userId: number, id: number): Promise<Expose<sessions>> {
    const session = await this.prisma.sessions.findOne({
      where: { id },
    });
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    if (session.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    return this.prisma.expose<sessions>(session);
  }

  async deleteSession(userId: number, id: number): Promise<Expose<sessions>> {
    const testSession = await this.prisma.sessions.findOne({
      where: { id },
    });
    if (!testSession) throw new NotFoundException(SESSION_NOT_FOUND);
    if (testSession.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const session = await this.prisma.sessions.delete({
      where: { id },
    });
    return this.prisma.expose<sessions>(session);
  }
}
