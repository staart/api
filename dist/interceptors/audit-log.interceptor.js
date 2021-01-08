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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var AuditLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const request_ip_1 = require("request-ip");
const operators_1 = require("rxjs/operators");
const ua_parser_js_1 = require("ua-parser-js");
const errors_constants_1 = require("../errors/errors.constants");
const audit_log_constants_1 = require("../modules/audit-logs/audit-log.constants");
const webhooks_service_1 = require("../modules/webhooks/webhooks.service");
const geolocation_service_1 = require("../providers/geolocation/geolocation.service");
const prisma_service_1 = require("../providers/prisma/prisma.service");
let AuditLogger = AuditLogger_1 = class AuditLogger {
    constructor(reflector, prisma, geolocationService, webhooksService) {
        this.reflector = reflector;
        this.prisma = prisma;
        this.geolocationService = geolocationService;
        this.webhooksService = webhooksService;
        this.logger = new common_1.Logger(AuditLogger_1.name);
    }
    intercept(context, next) {
        let auditLog = this.reflector.get(audit_log_constants_1.STAART_AUDIT_LOG_DATA, context.getHandler());
        return next.handle().pipe(operators_1.tap(() => {
            (async () => {
                var e_1, _a;
                var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                if (auditLog) {
                    if (typeof auditLog === 'string')
                        auditLog = [auditLog];
                    const request = context.switchToHttp().getRequest();
                    const groupId = parseInt(request.params.groupId);
                    if (isNaN(groupId))
                        throw new common_1.BadGatewayException(errors_constants_1.GROUP_NOT_FOUND);
                    const ip = request_ip_1.getClientIp(request);
                    const location = await this.geolocationService.getLocation(ip);
                    const userAgent = request.get('user-agent');
                    const ua = new ua_parser_js_1.UAParser(userAgent);
                    try {
                        for (var auditLog_1 = __asyncValues(auditLog), auditLog_1_1; auditLog_1_1 = await auditLog_1.next(), !auditLog_1_1.done;) {
                            const event = auditLog_1_1.value;
                            const data = {
                                event,
                                city: (_c = (_b = location === null || location === void 0 ? void 0 : location.city) === null || _b === void 0 ? void 0 : _b.names) === null || _c === void 0 ? void 0 : _c.en,
                                region: (_f = (_e = (_d = location === null || location === void 0 ? void 0 : location.subdivisions) === null || _d === void 0 ? void 0 : _d.pop()) === null || _e === void 0 ? void 0 : _e.names) === null || _f === void 0 ? void 0 : _f.en,
                                timezone: (_g = location === null || location === void 0 ? void 0 : location.location) === null || _g === void 0 ? void 0 : _g.time_zone,
                                countryCode: (_h = location === null || location === void 0 ? void 0 : location.country) === null || _h === void 0 ? void 0 : _h.iso_code,
                                userAgent,
                                browser: `${(_j = ua.getBrowser().name) !== null && _j !== void 0 ? _j : ''} ${(_k = ua.getBrowser().version) !== null && _k !== void 0 ? _k : ''}`.trim() || undefined,
                                operatingSystem: `${(_l = ua.getOS().name) !== null && _l !== void 0 ? _l : ''} ${(_m = ua.getOS().version) !== null && _m !== void 0 ? _m : ''}`
                                    .replace('Mac OS', 'macOS')
                                    .trim() || undefined,
                            };
                            if (request.user.id && request.user.type === 'user')
                                data.user = { connect: { id: request.user.id } };
                            if (groupId)
                                data.group = { connect: { id: groupId } };
                            await this.prisma.auditLog.create({ data });
                            this.webhooksService.triggerWebhook(groupId, event);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (auditLog_1_1 && !auditLog_1_1.done && (_a = auditLog_1.return)) await _a.call(auditLog_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            })()
                .then(() => { })
                .catch((err) => this.logger.error('Unable to save audit log', err));
        }));
    }
};
AuditLogger = AuditLogger_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService,
        geolocation_service_1.GeolocationService,
        webhooks_service_1.WebhooksService])
], AuditLogger);
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=audit-log.interceptor.js.map