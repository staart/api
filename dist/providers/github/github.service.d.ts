import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
export declare class GitHubService {
    private configService;
    private logger;
    octokit: Octokit;
    constructor(configService: ConfigService);
}
