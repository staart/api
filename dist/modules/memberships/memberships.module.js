"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mail_module_1 = require("../../providers/mail/mail.module");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const api_keys_module_1 = require("../api-keys/api-keys.module");
const auth_module_1 = require("../auth/auth.module");
const groups_module_1 = require("../groups/groups.module");
const memberships_group_controller_1 = require("./memberships-group.controller");
const memberships_user_controller_1 = require("./memberships-user.controller");
const memberships_service_1 = require("./memberships.service");
let MembershipsModule = class MembershipsModule {
};
MembershipsModule = __decorate([
    common_1.Module({
        imports: [
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            config_1.ConfigModule,
            auth_module_1.AuthModule,
            groups_module_1.GroupsModule,
            api_keys_module_1.ApiKeysModule,
        ],
        controllers: [memberships_user_controller_1.UserMembershipController, memberships_group_controller_1.GroupMembershipController],
        providers: [memberships_service_1.MembershipsService],
    })
], MembershipsModule);
exports.MembershipsModule = MembershipsModule;
//# sourceMappingURL=memberships.module.js.map