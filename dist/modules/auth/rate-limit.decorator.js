"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const RateLimit = (rateLimit) => common_1.SetMetadata('rateLimit', rateLimit);
exports.RateLimit = RateLimit;
//# sourceMappingURL=rate-limit.decorator.js.map