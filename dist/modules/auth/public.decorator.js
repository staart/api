"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = void 0;
const auth_constants_1 = require("./auth.constants");
function Public() {
    return (target, _, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(auth_constants_1.STAART_PUBLIC_ENDPOINT, true, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(auth_constants_1.STAART_PUBLIC_ENDPOINT, true, target);
        return target;
    };
}
exports.Public = Public;
//# sourceMappingURL=public.decorator.js.map