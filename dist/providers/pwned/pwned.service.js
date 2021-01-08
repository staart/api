"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PwnedService = void 0;
const common_1 = require("@nestjs/common");
const hibp_1 = require("hibp");
let PwnedService = class PwnedService {
    async isPasswordSafe(password) {
        try {
            const numberOfPwned = await this.unsafeCheckPwnedPassword(password);
            return !numberOfPwned;
        }
        catch (error) {
            return true;
        }
    }
    async unsafeCheckPwnedPassword(password) {
        return hibp_1.pwnedPassword(password);
    }
};
PwnedService = __decorate([
    common_1.Injectable()
], PwnedService);
exports.PwnedService = PwnedService;
//# sourceMappingURL=pwned.service.js.map