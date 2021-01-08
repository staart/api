"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const common_1 = require("@nestjs/common");
const audit_log_constants_1 = require("./audit-log.constants");
const AuditLog = (...value) => common_1.SetMetadata(audit_log_constants_1.STAART_AUDIT_LOG_DATA, value);
exports.AuditLog = AuditLog;
//# sourceMappingURL=audit-log.decorator.js.map