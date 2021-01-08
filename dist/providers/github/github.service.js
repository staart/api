"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GitHubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rest_1 = require("@octokit/rest");
let GitHubService = GitHubService_1 = class GitHubService {
    constructor(configService) {
        var _a;
        this.configService = configService;
        this.logger = new common_1.Logger(GitHubService_1.name);
        const config = this.configService.get('github');
        if (config.auth)
            this.octokit = new rest_1.Octokit({
                auth: config.auth,
                userAgent: (_a = config.userAgent) !== null && _a !== void 0 ? _a : 'staart',
            });
        else
            this.logger.warn('GitHub API key not found');
    }
};
GitHubService = GitHubService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GitHubService);
exports.GitHubService = GitHubService;
//# sourceMappingURL=github.service.js.map