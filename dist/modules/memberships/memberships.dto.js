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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateGroupMembershipDto = exports.UpdateMembershipDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateMembershipDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { role: { required: false, type: () => Object } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['OWNER', 'ADMIN', 'MEMBER']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateMembershipDto.prototype, "role", void 0);
exports.UpdateMembershipDto = UpdateMembershipDto;
class CreateGroupMembershipDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, name: { required: false, type: () => String, minLength: 3 }, role: { required: false, type: () => Object } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateGroupMembershipDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    class_validator_1.MinLength(3),
    __metadata("design:type", String)
], CreateGroupMembershipDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['OWNER', 'ADMIN', 'MEMBER']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateGroupMembershipDto.prototype, "role", void 0);
exports.CreateGroupMembershipDto = CreateGroupMembershipDto;
//# sourceMappingURL=memberships.dto.js.map