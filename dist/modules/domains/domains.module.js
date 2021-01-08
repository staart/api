"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const dns_module_1 = require("../../providers/dns/dns.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const domains_controller_1 = require("./domains.controller");
const domains_service_1 = require("./domains.service");
let DomainsModule = class DomainsModule {
};
DomainsModule = __decorate([
    common_1.Module({
        imports: [prisma_module_1.PrismaModule, tokens_module_1.TokensModule, dns_module_1.DnsModule, config_1.ConfigModule],
        controllers: [domains_controller_1.DomainController],
        providers: [domains_service_1.DomainsService],
    })
], DomainsModule);
exports.DomainsModule = DomainsModule;
//# sourceMappingURL=domains.module.js.map