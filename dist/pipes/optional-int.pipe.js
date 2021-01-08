"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalIntPipe = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../errors/errors.constants");
let OptionalIntPipe = class OptionalIntPipe {
    transform(value, metadata) {
        if (value == null)
            return undefined;
        const num = Number(value);
        if (isNaN(num))
            throw new common_1.BadRequestException(errors_constants_1.OPTIONAL_INT_PIPE_NUMBER.replace('$key', metadata.data));
        return num;
    }
};
OptionalIntPipe = __decorate([
    common_1.Injectable()
], OptionalIntPipe);
exports.OptionalIntPipe = OptionalIntPipe;
//# sourceMappingURL=optional-int.pipe.js.map