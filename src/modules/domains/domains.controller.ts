import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Domain } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import {
  DOMAIN_VERIFICATION_HTML,
  DOMAIN_VERIFICATION_TXT,
} from './domains.constants';
import { CreateDomainDto } from './domains.dto';
import { DomainsService } from './domains.service';

@Controller('groups/:groupId/domains')
export class DomainController {
  constructor(private domainsService: DomainsService) {}

  @Post()
  @AuditLog('create-domain')
  @Scopes('group-{groupId}:write-domain-*')
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateDomainDto,
  ): Promise<Expose<Domain>> {
    return this.domainsService.createDomain(groupId, data);
  }

  @Get()
  @Scopes('group-{groupId}:read-domain-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Domain>[]> {
    return this.domainsService.getDomains(groupId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-domain-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Domain>> {
    return this.domainsService.getDomain(groupId, Number(id));
  }

  @Delete(':id')
  @AuditLog('delete-domain')
  @Scopes('group-{groupId}:delete-domain-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Domain>> {
    return this.domainsService.deleteDomain(groupId, Number(id));
  }

  @Post(':id/verify/txt')
  @AuditLog('verify-domain-txt')
  @Scopes('group-{groupId}:write-domain-{id}')
  async verifyTxt(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Domain>> {
    return this.domainsService.verifyDomain(
      groupId,
      Number(id),
      DOMAIN_VERIFICATION_TXT,
    );
  }

  @Post(':id/verify/html')
  @AuditLog('verify-domain-html')
  @Scopes('group-{groupId}:write-domain-{id}')
  async verifyHtml(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Domain>> {
    return this.domainsService.verifyDomain(
      groupId,
      Number(id),
      DOMAIN_VERIFICATION_HTML,
    );
  }
}
