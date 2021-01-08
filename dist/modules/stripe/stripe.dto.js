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
exports.ReplaceBillingDto = exports.UpdateBillingDto = exports.CreateBillingDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class Address {
    static _OPENAPI_METADATA_FACTORY() {
        return { line1: { required: true, type: () => String }, city: { required: false, type: () => String }, country: { required: false, type: () => String }, line2: { required: false, type: () => String }, postal_code: { required: false, type: () => String }, state: { required: false, type: () => String } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], Address.prototype, "line1", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], Address.prototype, "city", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    class_validator_1.Length(2),
    __metadata("design:type", String)
], Address.prototype, "country", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], Address.prototype, "line2", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], Address.prototype, "postal_code", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], Address.prototype, "state", void 0);
class CreateBillingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, name: { required: true, type: () => String }, phone: { required: false, type: () => String }, promotion_code: { required: false, type: () => String }, address: { required: false, type: () => Address } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "phone", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], CreateBillingDto.prototype, "promotion_code", void 0);
__decorate([
    class_validator_1.IsObject(),
    class_validator_1.ValidateNested(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Address)
], CreateBillingDto.prototype, "address", void 0);
exports.CreateBillingDto = CreateBillingDto;
class UpdateBillingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { default_source: { required: false, type: () => String }, email: { required: false, type: () => String }, name: { required: false, type: () => String }, phone: { required: false, type: () => String }, promotion_code: { required: false, type: () => String }, address: { required: false, type: () => Address } };
    }
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "default_source", void 0);
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "phone", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "promotion_code", void 0);
__decorate([
    class_validator_1.IsObject(),
    class_validator_1.ValidateNested(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Address)
], UpdateBillingDto.prototype, "address", void 0);
exports.UpdateBillingDto = UpdateBillingDto;
class ReplaceBillingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, name: { required: true, type: () => String }, phone: { required: true, type: () => String }, address: { required: true, type: () => Address } };
    }
}
__decorate([
    class_validator_1.IsEmail(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceBillingDto.prototype, "email", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceBillingDto.prototype, "name", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], ReplaceBillingDto.prototype, "phone", void 0);
__decorate([
    class_validator_1.IsObject(),
    class_validator_1.ValidateNested(),
    __metadata("design:type", Address)
], ReplaceBillingDto.prototype, "address", void 0);
exports.ReplaceBillingDto = ReplaceBillingDto;
//# sourceMappingURL=stripe.dto.js.map