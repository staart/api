"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEmail = void 0;
const normalize_email_1 = __importDefault(require("normalize-email"));
const safeEmail = (input) => {
    return normalize_email_1.default(input.toLowerCase().trim());
};
exports.safeEmail = safeEmail;
//# sourceMappingURL=safe-email.js.map