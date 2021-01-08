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
exports.EnableSmsMfaDto = exports.EnableTotpMfaDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class EnableTotpMfaDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], EnableTotpMfaDto.prototype, "token", void 0);
exports.EnableTotpMfaDto = EnableTotpMfaDto;
class EnableSmsMfaDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: false, type: () => String }, phone: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], EnableSmsMfaDto.prototype, "token", void 0);
__decorate([
    class_validator_1.IsPhoneNumber('ZZ'),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], EnableSmsMfaDto.prototype, "phone", void 0);
exports.EnableSmsMfaDto = EnableSmsMfaDto;
//# sourceMappingURL=multi-factor-authentication.dto.js.map