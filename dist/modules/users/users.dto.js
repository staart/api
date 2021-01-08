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
exports.UpdateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateUserDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { checkLocationOnLogin: { required: false, type: () => Boolean }, countryCode: { required: false, type: () => String }, gender: { required: false, type: () => Object }, name: { required: false, type: () => String, minLength: 3 }, notificationEmails: { required: false, type: () => Object }, newPassword: { required: false, type: () => String }, currentPassword: { required: false, type: () => String }, ignorePwnedPassword: { required: false, type: () => Boolean }, prefersLanguage: { required: false, type: () => String }, prefersColorScheme: { required: false, type: () => Object }, prefersReducedMotion: { required: false, type: () => Object }, profilePictureUrl: { required: false, type: () => String }, timezone: { required: false, type: () => String }, twoFactorMethod: { required: false, type: () => Object } };
    }
}
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "checkLocationOnLogin", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.Length(2, 2),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "countryCode", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "gender", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.MinLength(3),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsIn(['ACCOUNT', 'UPDATES', 'PROMOTIONS']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "notificationEmails", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "newPassword", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "currentPassword", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "ignorePwnedPassword", void 0);
__decorate([
    class_validator_1.IsLocale(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "prefersLanguage", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['NO_PREFERENCE', 'LIGHT', 'DARK']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "prefersColorScheme", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['NO_PREFERENCE', 'REDUCE']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "prefersReducedMotion", void 0);
__decorate([
    class_validator_1.IsUrl(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "profilePictureUrl", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "timezone", void 0);
__decorate([
    class_validator_1.IsEnum(['NONE', 'TOTP', 'EMAIL']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "twoFactorMethod", void 0);
exports.UpdateUserDto = UpdateUserDto;
//# sourceMappingURL=users.dto.js.map