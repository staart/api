"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const configuration_1 = __importDefault(require("./config/configuration"));
const audit_log_interceptor_1 = require("./interceptors/audit-log.interceptor");
const rate_limit_interceptor_1 = require("./interceptors/rate-limit.interceptor");
const api_logger_middleware_1 = require("./middleware/api-logger.middleware");
const json_body_middleware_1 = require("./middleware/json-body.middleware");
const raw_body_middleware_1 = require("./middleware/raw-body.middleware");
const api_keys_module_1 = require("./modules/api-keys/api-keys.module");
const approved_subnets_module_1 = require("./modules/approved-subnets/approved-subnets.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const auth_module_1 = require("./modules/auth/auth.module");
const scope_guard_1 = require("./modules/auth/scope.guard");
const staart_auth_guard_1 = require("./modules/auth/staart-auth.guard");
const domains_module_1 = require("./modules/domains/domains.module");
const emails_module_1 = require("./modules/emails/emails.module");
const groups_module_1 = require("./modules/groups/groups.module");
const memberships_module_1 = require("./modules/memberships/memberships.module");
const multi_factor_authentication_module_1 = require("./modules/multi-factor-authentication/multi-factor-authentication.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const stripe_module_1 = require("./modules/stripe/stripe.module");
const users_module_1 = require("./modules/users/users.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const airtable_module_1 = require("./providers/airtable/airtable.module");
const cloudinary_module_1 = require("./providers/cloudinary/cloudinary.module");
const dns_module_1 = require("./providers/dns/dns.module");
const elasticsearch_module_1 = require("./providers/elasticsearch/elasticsearch.module");
const firebase_module_1 = require("./providers/firebase/firebase.module");
const geolocation_module_1 = require("./providers/geolocation/geolocation.module");
const github_module_1 = require("./providers/github/github.module");
const google_maps_module_1 = require("./providers/google-maps/google-maps.module");
const mail_module_1 = require("./providers/mail/mail.module");
const playwright_module_1 = require("./providers/playwright/playwright.module");
const prisma_module_1 = require("./providers/prisma/prisma.module");
const s3_module_1 = require("./providers/s3/s3.module");
const slack_module_1 = require("./providers/slack/slack.module");
const tasks_module_1 = require("./providers/tasks/tasks.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(raw_body_middleware_1.RawBodyMiddleware)
            .forRoutes({
            path: '/webhooks/stripe',
            method: common_1.RequestMethod.POST,
        })
            .apply(json_body_middleware_1.JsonBodyMiddleware)
            .forRoutes('*')
            .apply(api_logger_middleware_1.ApiLoggerMiddleware)
            .forRoutes('*');
    }
};
AppModule = __decorate([
    common_1.Module({
        imports: [
            config_1.ConfigModule.forRoot({
                load: [configuration_1.default],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            tasks_module_1.TasksModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            mail_module_1.MailModule,
            sessions_module_1.SessionsModule,
            emails_module_1.EmailsModule,
            groups_module_1.GroupsModule,
            multi_factor_authentication_module_1.MultiFactorAuthenticationModule,
            api_keys_module_1.ApiKeysModule,
            approved_subnets_module_1.ApprovedSubnetsModule,
            domains_module_1.DomainsModule,
            dns_module_1.DnsModule,
            geolocation_module_1.GeolocationModule,
            memberships_module_1.MembershipsModule,
            stripe_module_1.StripeModule,
            audit_logs_module_1.AuditLogsModule,
            webhooks_module_1.WebhooksModule,
            elasticsearch_module_1.ElasticSearchModule,
            slack_module_1.SlackModule,
            airtable_module_1.AirtableModule,
            s3_module_1.S3Module,
            cloudinary_module_1.CloudinaryModule,
            firebase_module_1.FirebaseModule,
            github_module_1.GitHubModule,
            google_maps_module_1.GoogleMapsModule,
            playwright_module_1.PlaywrightModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: rate_limit_interceptor_1.RateLimitInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: staart_auth_guard_1.StaartAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: scope_guard_1.ScopesGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_log_interceptor_1.AuditLogger,
            },
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map