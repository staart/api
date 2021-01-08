"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const approved_subnets_service_1 = require("../approved-subnets/approved-subnets.service");
const auth_service_1 = require("../auth/auth.service");
const mail_module_1 = require("../../providers/mail/mail.module");
const geolocation_service_1 = require("../../providers/geolocation/geolocation.service");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const pwned_module_1 = require("../../providers/pwned/pwned.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const twilio_module_1 = require("../../providers/twilio/twilio.module");
const users_service_1 = require("../users/users.service");
const emails_controller_1 = require("./emails.controller");
const emails_service_1 = require("./emails.service");
let EmailsModule = class EmailsModule {
};
EmailsModule = __decorate([
    common_1.Module({
        imports: [
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            config_1.ConfigModule,
            twilio_module_1.TwilioModule,
            pwned_module_1.PwnedModule,
            tokens_module_1.TokensModule,
        ],
        controllers: [emails_controller_1.EmailController],
        providers: [
            emails_service_1.EmailsService,
            users_service_1.UsersService,
            auth_service_1.AuthService,
            geolocation_service_1.GeolocationService,
            approved_subnets_service_1.ApprovedSubnetsService,
        ],
    })
], EmailsModule);
exports.EmailsModule = EmailsModule;
//# sourceMappingURL=emails.module.js.map