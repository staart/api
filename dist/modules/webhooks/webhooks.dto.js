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
exports.ReplaceWebhookDto = exports.UpdateWebhookDto = exports.CreateWebhookDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateWebhookDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: true, type: () => String }, event: { required: true, type: () => String }, contentType: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, secret: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "url", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "event", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "contentType", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], CreateWebhookDto.prototype, "isActive", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "secret", void 0);
exports.CreateWebhookDto = CreateWebhookDto;
class UpdateWebhookDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: false, type: () => String }, event: { required: false, type: () => String }, contentType: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, secret: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "url", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "event", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "contentType", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], UpdateWebhookDto.prototype, "isActive", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateWebhookDto.prototype, "secret", void 0);
exports.UpdateWebhookDto = UpdateWebhookDto;
class ReplaceWebhookDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { url: { required: true, type: () => String }, event: { required: true, type: () => String }, contentType: { required: true, type: () => String }, isActive: { required: true, type: () => Boolean }, secret: { required: true, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceWebhookDto.prototype, "url", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceWebhookDto.prototype, "event", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ReplaceWebhookDto.prototype, "contentType", void 0);
__decorate([
    class_validator_1.IsBoolean(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Boolean)
], ReplaceWebhookDto.prototype, "isActive", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ReplaceWebhookDto.prototype, "secret", void 0);
exports.ReplaceWebhookDto = ReplaceWebhookDto;
//# sourceMappingURL=webhooks.dto.js.map