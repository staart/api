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
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = require("jsonwebtoken");
const configuration_interface_1 = require("../../config/configuration.interface");
const uuid_1 = require("uuid");
const errors_constants_1 = require("../../errors/errors.constants");
let TokensService = class TokensService {
    constructor(configService) {
        this.configService = configService;
        this.securityConfig = this.configService.get('security');
    }
    signJwt(jwtType, payload, expiresIn, options) {
        return jsonwebtoken_1.sign(Object.assign(Object.assign({}, payload), { typ: jwtType }), this.securityConfig.jwtSecret, Object.assign(Object.assign({}, options), { expiresIn, issuer: this.securityConfig.issuerDomain }));
    }
    verify(jwtType, token, options) {
        try {
            const result = jsonwebtoken_1.verify(token, this.securityConfig.jwtSecret, options);
            if ('typ' in result) {
                if (result.typ !== jwtType)
                    throw new Error();
            }
            else
                throw new Error();
            return result;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(errors_constants_1.INVALID_TOKEN);
        }
    }
    decode(token, options) {
        return jsonwebtoken_1.decode(token, options);
    }
    generateUuid() {
        return uuid_1.v4();
    }
};
TokensService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TokensService);
exports.TokensService = TokensService;
//# sourceMappingURL=tokens.service.js.map