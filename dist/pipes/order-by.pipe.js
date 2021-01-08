"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderByPipe = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../errors/errors.constants");
let OrderByPipe = class OrderByPipe {
    transform(value, metadata) {
        if (value == null)
            return undefined;
        try {
            const rules = value.split(',').map((val) => val.trim());
            const orderBy = {};
            rules.forEach((rule) => {
                const [key, order] = rule.split(':');
                if (!['asc', 'desc'].includes(order.toLocaleLowerCase()))
                    throw new common_1.BadGatewayException(errors_constants_1.ORDER_BY_ASC_DESC);
                orderBy[key] = order.toLocaleLowerCase();
            });
            return orderBy;
        }
        catch (_) {
            throw new common_1.BadRequestException(errors_constants_1.ORDER_BY_FORMAT);
        }
    }
};
OrderByPipe = __decorate([
    common_1.Injectable()
], OrderByPipe);
exports.OrderByPipe = OrderByPipe;
//# sourceMappingURL=order-by.pipe.js.map