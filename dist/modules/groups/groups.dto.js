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
exports.ReplaceGroupDto = exports.UpdateGroupDto = exports.CreateGroupDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { autoJoinDomain: { required: false, type: () => Boolean }, forceTwoFactor: { required: false, type: () => Boolean }, ipRestrictions: { required: false, type: () => String }, name: { required: true, type: () => String }, onlyAllowDomain: { required: false, type: () => Boolean }, profilePictureUrl: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], CreateGroupDto.prototype, "autoJoinDomain", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], CreateGroupDto.prototype, "forceTwoFactor", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], CreateGroupDto.prototype, "onlyAllowDomain", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "profilePictureUrl", void 0);
exports.CreateGroupDto = CreateGroupDto;
class UpdateGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { autoJoinDomain: { required: false, type: () => Boolean }, forceTwoFactor: { required: false, type: () => Boolean }, ipRestrictions: { required: false, type: () => String }, name: { required: false, type: () => String }, onlyAllowDomain: { required: false, type: () => Boolean }, profilePictureUrl: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateGroupDto.prototype, "autoJoinDomain", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateGroupDto.prototype, "forceTwoFactor", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateGroupDto.prototype, "onlyAllowDomain", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "profilePictureUrl", void 0);
exports.UpdateGroupDto = UpdateGroupDto;
class ReplaceGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { autoJoinDomain: { required: true, type: () => Boolean }, forceTwoFactor: { required: true, type: () => Boolean }, ipRestrictions: { required: true, type: () => String }, name: { required: true, type: () => String }, onlyAllowDomain: { required: true, type: () => Boolean }, profilePictureUrl: { required: true, type: () => String }, attributes: { required: true, type: () => Object } };
    }
}
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Boolean)
], ReplaceGroupDto.prototype, "autoJoinDomain", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Boolean)
], ReplaceGroupDto.prototype, "forceTwoFactor", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceGroupDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceGroupDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Boolean)
], ReplaceGroupDto.prototype, "onlyAllowDomain", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceGroupDto.prototype, "profilePictureUrl", void 0);
__decorate([
    class_validator_1.IsObject(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Object)
], ReplaceGroupDto.prototype, "attributes", void 0);
exports.ReplaceGroupDto = ReplaceGroupDto;
//# sourceMappingURL=groups.dto.js.map