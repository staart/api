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
exports.StaartAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const auth_constants_1 = require("./auth.constants");
let StaartAuthGuard = class StaartAuthGuard extends passport_1.AuthGuard('staart') {
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const decoratorSkip = this.reflector.get(auth_constants_1.STAART_PUBLIC_ENDPOINT, context.getClass()) ||
            this.reflector.get(auth_constants_1.STAART_PUBLIC_ENDPOINT, context.getHandler());
        if (decoratorSkip)
            return true;
        return super.canActivate(context);
    }
};
StaartAuthGuard = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [core_1.Reflector])
], StaartAuthGuard);
exports.StaartAuthGuard = StaartAuthGuard;
//# sourceMappingURL=staart-auth.guard.js.map