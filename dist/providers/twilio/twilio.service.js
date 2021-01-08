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
var TwilioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const p_queue_1 = __importDefault(require("p-queue"));
const p_retry_1 = __importDefault(require("p-retry"));
const configuration_interface_1 = require("../../config/configuration.interface");
const twilio_1 = __importDefault(require("twilio"));
let TwilioService = TwilioService_1 = class TwilioService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TwilioService_1.name);
        this.smsConfig = this.configService.get('sms');
        this.queue = new p_queue_1.default({ concurrency: 1 });
        const twilioAccountSid = this.smsConfig.twilioAccountSid;
        const twilioAuthToken = this.smsConfig.twilioAuthToken;
        if (!twilioAccountSid || !twilioAuthToken)
            this.logger.warn('Twilio account SID/auth token not found');
        this.client = twilio_1.default(twilioAccountSid || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', twilioAuthToken || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    }
    send(options) {
        this.queue
            .add(() => p_retry_1.default(() => this.sendSms(options), {
            retries: this.smsConfig.retries,
            onFailedAttempt: (error) => {
                this.logger.error(`SMS to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`, error.name);
            },
        }))
            .then(() => { })
            .catch(() => { });
    }
    async sendSms(options) {
        return this.client.messages.create(options);
    }
};
TwilioService = TwilioService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TwilioService);
exports.TwilioService = TwilioService;
//# sourceMappingURL=twilio.service.js.map