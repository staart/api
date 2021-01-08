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
exports.VerifyEmailDto = exports.TotpLoginDto = exports.LoginDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.ResendEmailVerificationDto = exports.RegisterDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 3 }, email: { required: true, type: () => String }, checkLocationOnLogin: { required: false, type: () => Boolean }, countryCode: { required: false, type: () => String }, gender: { required: false, type: () => Object }, notificationEmails: { required: false, type: () => Object }, password: { required: false, type: () => String, nullable: true }, prefersLanguage: { required: false, type: () => String }, prefersColorScheme: { required: false, type: () => Object }, prefersReducedMotion: { required: false, type: () => Object }, profilePictureUrl: { required: false, type: () => String }, timezone: { required: false, type: () => String }, ignorePwnedPassword: { required: false, type: () => Boolean } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.MinLength(3),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "checkLocationOnLogin", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.Length(2, 2),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "countryCode", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "gender", void 0);
__decorate([
    class_validator_1.IsIn(['ACCOUNT', 'UPDATES', 'PROMOTIONS']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "notificationEmails", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    class_validator_1.IsLocale(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "prefersLanguage", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['NO_PREFERENCE', 'LIGHT', 'DARK']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "prefersColorScheme", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsIn(['NO_PREFERENCE', 'REDUCE']),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "prefersReducedMotion", void 0);
__decorate([
    class_validator_1.IsUrl(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "profilePictureUrl", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], RegisterDto.prototype, "timezone", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], RegisterDto.prototype, "ignorePwnedPassword", void 0);
exports.RegisterDto = RegisterDto;
class ResendEmailVerificationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ResendEmailVerificationDto.prototype, "email", void 0);
exports.ResendEmailVerificationDto = ResendEmailVerificationDto;
class ForgotPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
exports.ForgotPasswordDto = ForgotPasswordDto;
class ResetPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: true, type: () => String }, password: { required: true, type: () => String, minLength: 8 }, ignorePwnedPassword: { required: false, type: () => Boolean } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.MinLength(8),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], ResetPasswordDto.prototype, "ignorePwnedPassword", void 0);
exports.ResetPasswordDto = ResetPasswordDto;
class LoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, password: { required: false, type: () => String, minLength: 8 }, code: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.MinLength(8),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.Length(6),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], LoginDto.prototype, "code", void 0);
exports.LoginDto = LoginDto;
class TotpLoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: true, type: () => String }, code: { required: true, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], TotpLoginDto.prototype, "token", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.Length(6),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], TotpLoginDto.prototype, "code", void 0);
exports.TotpLoginDto = TotpLoginDto;
class VerifyEmailDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: true, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "token", void 0);
exports.VerifyEmailDto = VerifyEmailDto;
//# sourceMappingURL=auth.dto.js.map