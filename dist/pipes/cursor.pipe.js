"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorPipe = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../errors/errors.constants");
const parse_object_literal_1 = require("../helpers/parse-object-literal");
let CursorPipe = class CursorPipe {
    transform(value) {
        if (value == null)
            return undefined;
        if (!value.includes(':'))
            value = `id:${value}`;
        try {
            const rules = parse_object_literal_1.parseObjectLiteral(value);
            const items = {};
            rules.forEach((rule) => {
                const num = Number(rule[1]);
                if (!isNaN(num))
                    items[rule[0]] = num;
                else if (rule[1])
                    items[rule[0]] = rule[1];
            });
            return items;
        }
        catch (_) {
            throw new common_1.BadRequestException(errors_constants_1.CURSOR_PIPE_FORMAT);
        }
    }
};
CursorPipe = __decorate([
    common_1.Injectable()
], CursorPipe);
exports.CursorPipe = CursorPipe;
//# sourceMappingURL=cursor.pipe.js.map