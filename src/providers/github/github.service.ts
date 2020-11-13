import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class GitHubService {
  private logger = new Logger(GitHubService.name);
  octokit: Octokit;

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['github']>('github');
    if (config.auth)
      this.octokit = new Octokit({
        auth: config.auth,
        userAgent: config.userAgent ?? 'staart',
      });
    else this.logger.warn('GitHub API key not found');
  }
}
