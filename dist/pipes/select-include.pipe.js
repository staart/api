"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectIncludePipe = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../errors/errors.constants");
const dot_object_1 = require("dot-object");
let SelectIncludePipe = class SelectIncludePipe {
    transform(value) {
        if (value == null)
            return undefined;
        try {
            const testRecord = {};
            value.split(',').forEach((i) => {
                if (/^[a-z0-9\.]+$/i.test(i.trim()))
                    testRecord[i.trim()] = true;
            });
            return dot_object_1.object(testRecord);
        }
        catch (_) {
            throw new common_1.BadRequestException(errors_constants_1.SELECT_INCLUDE_PIPE_FORMAT);
        }
    }
};
SelectIncludePipe = __decorate([
    common_1.Injectable()
], SelectIncludePipe);
exports.SelectIncludePipe = SelectIncludePipe;
//# sourceMappingURL=select-include.pipe.js.map