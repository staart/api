"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const geolocation_module_1 = require("../../providers/geolocation/geolocation.module");
const mail_module_1 = require("../../providers/mail/mail.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const pwned_module_1 = require("../../providers/pwned/pwned.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const twilio_module_1 = require("../../providers/twilio/twilio.module");
const api_keys_module_1 = require("../api-keys/api-keys.module");
const approved_subnets_module_1 = require("../approved-subnets/approved-subnets.module");
const approved_subnets_service_1 = require("../approved-subnets/approved-subnets.service");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const staart_strategy_1 = require("./staart.strategy");
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    common_1.Module({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            tokens_module_1.TokensModule,
            config_1.ConfigModule,
            pwned_module_1.PwnedModule,
            api_keys_module_1.ApiKeysModule,
            twilio_module_1.TwilioModule,
            geolocation_module_1.GeolocationModule,
            approved_subnets_module_1.ApprovedSubnetsModule,
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService],
        providers: [auth_service_1.AuthService, staart_strategy_1.StaartStrategy, approved_subnets_service_1.ApprovedSubnetsService],
    })
], AuthModule);
exports.AuthModule = AuthModule;
//# sourceMappingURL=auth.module.js.map