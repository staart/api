"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovedSubnetsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const geolocation_module_1 = require("../../providers/geolocation/geolocation.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const approved_subnets_controller_1 = require("./approved-subnets.controller");
const approved_subnets_service_1 = require("./approved-subnets.service");
let ApprovedSubnetsModule = class ApprovedSubnetsModule {
};
ApprovedSubnetsModule = __decorate([
    common_1.Module({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule, geolocation_module_1.GeolocationModule],
        controllers: [approved_subnets_controller_1.ApprovedSubnetController],
        providers: [approved_subnets_service_1.ApprovedSubnetsService],
    })
], ApprovedSubnetsModule);
exports.ApprovedSubnetsModule = ApprovedSubnetsModule;
//# sourceMappingURL=approved-subnets.module.js.map