import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubService } from './github.service';

@Module({
  imports: [ConfigModule],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
