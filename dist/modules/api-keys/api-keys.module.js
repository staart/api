"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const elasticsearch_module_1 = require("../../providers/elasticsearch/elasticsearch.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const stripe_module_1 = require("../stripe/stripe.module");
const api_keys_group_controller_1 = require("./api-keys-group.controller");
const api_keys_user_controller_1 = require("./api-keys-user.controller");
const api_keys_service_1 = require("./api-keys.service");
let ApiKeysModule = class ApiKeysModule {
};
ApiKeysModule = __decorate([
    common_1.Module({
        imports: [
            prisma_module_1.PrismaModule,
            tokens_module_1.TokensModule,
            stripe_module_1.StripeModule,
            config_1.ConfigModule,
            elasticsearch_module_1.ElasticSearchModule,
        ],
        controllers: [api_keys_group_controller_1.ApiKeyGroupController, api_keys_user_controller_1.ApiKeyUserController],
        providers: [api_keys_service_1.ApiKeysService],
        exports: [api_keys_service_1.ApiKeysService],
    })
], ApiKeysModule);
exports.ApiKeysModule = ApiKeysModule;
//# sourceMappingURL=api-keys.module.js.map