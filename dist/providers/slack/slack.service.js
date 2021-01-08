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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SlackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web_api_1 = require("@slack/web-api");
const p_queue_1 = __importDefault(require("p-queue"));
const p_retry_1 = __importDefault(require("p-retry"));
let SlackService = SlackService_1 = class SlackService {
    constructor(configService) {
        this.configService = configService;
        this.slackConfig = this.configService.get('slack');
        this.logger = new common_1.Logger(SlackService_1.name);
        this.queue = new p_queue_1.default({ concurrency: 1 });
        if (this.slackConfig.token)
            this.client = new web_api_1.WebClient(this.slackConfig.token, {
                slackApiUrl: this.slackConfig.slackApiUrl,
                rejectRateLimitedCalls: this.slackConfig.rejectRateLimitedCalls,
            });
    }
    send(options) {
        this.queue
            .add(() => p_retry_1.default(() => this.sendMessage(options), {
            retries: this.slackConfig.retries,
            onFailedAttempt: (error) => {
                this.logger.error(`Message to ${options.channel} failed, retrying (${error.retriesLeft} attempts left)`, error.name);
            },
        }))
            .then(() => { })
            .catch(() => { });
    }
    sendToChannel(channelName, text) {
        this.queue
            .add(() => p_retry_1.default(() => this.sendMessageToChannel(channelName, text), {
            retries: this.slackConfig.retries,
            onFailedAttempt: (error) => {
                this.logger.error(`Message to ${channelName} failed, retrying (${error.retriesLeft} attempts left)`, error.name);
            },
        }))
            .then(() => { })
            .catch(() => { });
    }
    async sendMessageToChannel(channelName, text) {
        var _a, _b;
        const conversations = (await ((_a = this.client) === null || _a === void 0 ? void 0 : _a.conversations.list()));
        const channel = conversations.channels.find((channel) => channel.name === channelName);
        const options = { text, channel: channel.id };
        return (_b = this.client) === null || _b === void 0 ? void 0 : _b.chat.postMessage(options);
    }
    async sendMessage(options) {
        var _a;
        return (_a = this.client) === null || _a === void 0 ? void 0 : _a.chat.postMessage(options);
    }
};
SlackService = SlackService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SlackService);
exports.SlackService = SlackService;
//# sourceMappingURL=slack.service.js.map