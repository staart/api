"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiFactorAuthenticationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../auth/auth.module");
const mail_module_1 = require("../../providers/mail/mail.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const twilio_module_1 = require("../../providers/twilio/twilio.module");
const multi_factor_authentication_controller_1 = require("./multi-factor-authentication.controller");
const multi_factor_authentication_service_1 = require("./multi-factor-authentication.service");
let MultiFactorAuthenticationModule = class MultiFactorAuthenticationModule {
};
MultiFactorAuthenticationModule = __decorate([
    common_1.Module({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            twilio_module_1.TwilioModule,
            mail_module_1.MailModule,
            config_1.ConfigModule,
            tokens_module_1.TokensModule,
        ],
        controllers: [multi_factor_authentication_controller_1.MultiFactorAuthenticationController],
        providers: [multi_factor_authentication_service_1.MultiFactorAuthenticationService],
    })
], MultiFactorAuthenticationModule);
exports.MultiFactorAuthenticationModule = MultiFactorAuthenticationModule;
//# sourceMappingURL=multi-factor-authentication.module.js.map