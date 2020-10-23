import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  sessions,
  sessionsOrderByInput,
  sessionsWhereInput,
  sessionsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
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
    return sessions.map(user => this.prisma.expose<sessions>(user));
  }

  async getSession(
    userId: number,
    id: number,
  ): Promise<Expose<sessions> | null> {
    const session = await this.prisma.sessions.findOne({
      where: { id },
    });
    if (session.userId !== userId) throw new UnauthorizedException();
    if (!session)
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<sessions>(session);
  }

  async deleteSession(userId: number, id: number): Promise<Expose<sessions>> {
    const testSession = await this.prisma.sessions.findOne({
      where: { id },
    });
    if (testSession.userId !== userId) throw new UnauthorizedException();
    const session = await this.prisma.sessions.delete({
      where: { id },
    });
    return this.prisma.expose<sessions>(session);
  }
}
