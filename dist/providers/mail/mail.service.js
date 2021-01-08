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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mustache_markdown_1 = require("@staart/mustache-markdown");
const aws_sdk_1 = require("aws-sdk");
const fs_1 = require("fs");
const mem_1 = __importDefault(require("mem"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const p_queue_1 = __importDefault(require("p-queue"));
const p_retry_1 = __importDefault(require("p-retry"));
const path_1 = require("path");
let MailService = MailService_1 = class MailService {
    constructor(configService) {
        var _a;
        this.configService = configService;
        this.logger = new common_1.Logger(MailService_1.name);
        this.emailConfig = this.configService.get('email');
        this.queue = new p_queue_1.default({ concurrency: 1 });
        this.readTemplate = mem_1.default(this.readTemplateUnmemoized);
        if ((_a = this.emailConfig.ses) === null || _a === void 0 ? void 0 : _a.accessKeyId)
            this.transport = nodemailer_1.default.createTransport({
                SES: new aws_sdk_1.SES({
                    apiVersion: '2010-12-01',
                    accessKeyId: this.emailConfig.ses.accessKeyId,
                    secretAccessKey: this.emailConfig.ses.secretAccessKey,
                    region: this.emailConfig.ses.region,
                }),
            });
        else
            this.transport = nodemailer_1.default.createTransport(this.emailConfig.transport);
    }
    send(options) {
        this.queue
            .add(() => p_retry_1.default(() => {
            var _a;
            return this.sendMail(Object.assign(Object.assign({}, options), { from: (_a = options.from) !== null && _a !== void 0 ? _a : `"${this.emailConfig.name}" <${this.emailConfig.from}>` }));
        }, {
            retries: this.emailConfig.retries,
            onFailedAttempt: (error) => {
                this.logger.error(`Mail to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`, error.name);
                console.log(error);
            },
        }))
            .then(() => { })
            .catch(() => { });
    }
    async sendMail(options) {
        var _a;
        if (options.template) {
            const layout = await this.readTemplate('layout.html');
            let template = await this.readTemplate(options.template);
            let [markdown, html] = mustache_markdown_1.render(template, options.data);
            if (markdown.startsWith('#')) {
                const subject = markdown.split('\n', 1)[0].replace('#', '').trim();
                if (subject) {
                    options.subject = (_a = options.subject) !== null && _a !== void 0 ? _a : subject;
                    markdown = markdown.replace(`# ${markdown.split('\n', 1)[0]}`, '');
                }
            }
            options.html = options.noLayout
                ? html
                : mustache_markdown_1.render(layout, { content: html })[1];
            options.text = markdown;
            options.alternatives = [
                {
                    contentType: 'text/x-web-markdown',
                    content: markdown,
                },
            ];
        }
        return this.transport.sendMail(options);
    }
    async readTemplateUnmemoized(name) {
        if (!name.endsWith('.html'))
            name = `${name}.md`;
        return fs_1.promises.readFile(path_1.join('.', 'src', 'templates', name), 'utf8');
    }
};
MailService = MailService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
exports.MailService = MailService;
//# sourceMappingURL=mail.service.js.map