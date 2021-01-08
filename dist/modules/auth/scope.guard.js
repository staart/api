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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const minimatch_1 = __importDefault(require("minimatch"));
let ScopesGuard = class ScopesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const scopes = this.reflector.get('scopes', context.getHandler());
        const request = context.switchToHttp().getRequest();
        if (!scopes)
            return true;
        const user = request.user;
        let authorized = false;
        if (!user)
            return false;
        for (const userScope of user.scopes) {
            for (let scope of scopes) {
                for (const key in request.params)
                    scope = scope.replace(`{${key}}`, request.params[key]);
                authorized = authorized || minimatch_1.default(scope, userScope);
                if (authorized)
                    return true;
            }
        }
        return authorized;
    }
};
ScopesGuard = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ScopesGuard);
exports.ScopesGuard = ScopesGuard;
//# sourceMappingURL=scope.guard.js.map