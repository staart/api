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
exports.ReplaceApiKeyDto = exports.UpdateApiKeyDto = exports.CreateApiKeyDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateApiKeyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: false, type: () => String }, name: { required: false, type: () => String }, scopes: { required: false, type: () => [String] }, ipRestrictions: { required: false, type: () => [String] }, referrerRestrictions: { required: false, type: () => [String] } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "description", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateApiKeyDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "scopes", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], CreateApiKeyDto.prototype, "referrerRestrictions", void 0);
exports.CreateApiKeyDto = CreateApiKeyDto;
class UpdateApiKeyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: false, type: () => String }, name: { required: false, type: () => String }, scopes: { required: false, type: () => [String] }, ipRestrictions: { required: false, type: () => [String] }, referrerRestrictions: { required: false, type: () => [String] } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "description", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateApiKeyDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "scopes", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], UpdateApiKeyDto.prototype, "referrerRestrictions", void 0);
exports.UpdateApiKeyDto = UpdateApiKeyDto;
class ReplaceApiKeyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { description: { required: true, type: () => String }, name: { required: true, type: () => String }, scopes: { required: true, type: () => [String] }, ipRestrictions: { required: true, type: () => [String] }, referrerRestrictions: { required: true, type: () => [String] } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceApiKeyDto.prototype, "description", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceApiKeyDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Array)
], ReplaceApiKeyDto.prototype, "scopes", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Array)
], ReplaceApiKeyDto.prototype, "ipRestrictions", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsString({ each: true }),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Array)
], ReplaceApiKeyDto.prototype, "referrerRestrictions", void 0);
exports.ReplaceApiKeyDto = ReplaceApiKeyDto;
//# sourceMappingURL=api-keys.dto.js.map