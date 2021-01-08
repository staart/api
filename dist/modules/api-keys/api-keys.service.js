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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const quick_lru_1 = __importDefault(require("quick-lru"));
const errors_constants_1 = require("../../errors/errors.constants");
const elasticsearch_service_1 = require("../../providers/elasticsearch/elasticsearch.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const stripe_service_1 = require("../stripe/stripe.service");
let ApiKeysService = class ApiKeysService {
    constructor(prisma, tokensService, stripeService, configService, elasticSearchService) {
        var _a;
        this.prisma = prisma;
        this.tokensService = tokensService;
        this.stripeService = stripeService;
        this.configService = configService;
        this.elasticSearchService = elasticSearchService;
        this.lru = new quick_lru_1.default({
            maxSize: (_a = this.configService.get('caching.apiKeyLruSize')) !== null && _a !== void 0 ? _a : 100,
        });
    }
    async createApiKeyForGroup(groupId, data) {
        const apiKey = this.tokensService.generateUuid();
        data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
        return this.prisma.apiKey.create({
            data: Object.assign(Object.assign({}, data), { apiKey, group: { connect: { id: groupId } } }),
        });
    }
    async createApiKeyForUser(userId, data) {
        const apiKey = this.tokensService.generateUuid();
        data.scopes = this.cleanScopesForUser(userId, data.scopes);
        return this.prisma.apiKey.create({
            data: Object.assign(Object.assign({}, data), { apiKey, user: { connect: { id: userId } } }),
        });
    }
    async getApiKeysForGroup(groupId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const ApiKey = await this.prisma.apiKey.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { group: { id: groupId } }),
            orderBy,
        });
        return ApiKey.map((group) => this.prisma.expose(group));
    }
    async getApiKeysForUser(userId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const ApiKey = await this.prisma.apiKey.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { user: { id: userId } }),
            orderBy,
        });
        return ApiKey.map((user) => this.prisma.expose(user));
    }
    async getApiKeyForGroup(groupId, id) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!apiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (apiKey.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(apiKey);
    }
    async getApiKeyForUser(userId, id) {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!apiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (apiKey.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(apiKey);
    }
    async getApiKeyFromKey(key) {
        if (this.lru.has(key))
            return this.lru.get(key);
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { apiKey: key },
        });
        if (!apiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        this.lru.set(key, apiKey);
        return this.prisma.expose(apiKey);
    }
    async updateApiKeyForGroup(groupId, id, data) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
        const apiKey = await this.prisma.apiKey.update({
            where: { id },
            data,
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async updateApiKeyForUser(userId, id, data) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        data.scopes = this.cleanScopesForUser(userId, data.scopes);
        const apiKey = await this.prisma.apiKey.update({
            where: { id },
            data,
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async replaceApiKeyForGroup(groupId, id, data) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
        const apiKey = await this.prisma.apiKey.update({
            where: { id },
            data,
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async replaceApiKeyForUser(userId, id, data) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        data.scopes = this.cleanScopesForUser(userId, data.scopes);
        const apiKey = await this.prisma.apiKey.update({
            where: { id },
            data,
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async deleteApiKeyForGroup(groupId, id) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const apiKey = await this.prisma.apiKey.delete({
            where: { id },
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async deleteApiKeyForUser(userId, id) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const apiKey = await this.prisma.apiKey.delete({
            where: { id },
        });
        this.lru.delete(testApiKey.apiKey);
        return this.prisma.expose(apiKey);
    }
    async getApiKeyLogsForGroup(groupId, id, params) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.getApiLogsFromKey(testApiKey.apiKey, params);
    }
    async getApiKeyLogsForUser(userId, id, params) {
        const testApiKey = await this.prisma.apiKey.findUnique({
            where: { id },
        });
        if (!testApiKey)
            throw new common_1.NotFoundException(errors_constants_1.API_KEY_NOT_FOUND);
        if (testApiKey.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.getApiLogsFromKey(testApiKey.apiKey, params);
    }
    async removeUnauthorizedScopesForUser(userId) {
        var e_1, _a;
        var _b;
        const userApiKeys = await this.prisma.apiKey.findMany({
            where: { user: { id: userId } },
        });
        if (!userApiKeys.length)
            return;
        const scopesAllowed = await this.getApiKeyScopesForUser(userId);
        try {
            for (var userApiKeys_1 = __asyncValues(userApiKeys), userApiKeys_1_1; userApiKeys_1_1 = await userApiKeys_1.next(), !userApiKeys_1_1.done;) {
                const apiKey = userApiKeys_1_1.value;
                const currentScopes = ((_b = apiKey.scopes) !== null && _b !== void 0 ? _b : []);
                const newScopes = currentScopes.filter((i) => Object.keys(scopesAllowed).includes(i));
                if (currentScopes.length !== newScopes.length)
                    this.prisma.apiKey.update({
                        where: { id: apiKey.id },
                        data: { scopes: newScopes },
                    });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (userApiKeys_1_1 && !userApiKeys_1_1.done && (_a = userApiKeys_1.return)) await _a.call(userApiKeys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    async getApiLogsFromKey(apiKey, params) {
        var _a, _b, _c, _d;
        const now = new Date();
        now.setDate(now.getDate() -
            this.configService.get('tracking.deleteOldLogsDays'));
        const result = await this.elasticSearchService.search({
            index: this.configService.get('tracking.index'),
            from: (_a = params.cursor) === null || _a === void 0 ? void 0 : _a.id,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    authorization: apiKey,
                                },
                            },
                            {
                                range: {
                                    date: {
                                        gte: ((_b = params.where) === null || _b === void 0 ? void 0 : _b.after) ? new Date(new Date().getTime() -
                                            new Date((_c = params.where) === null || _c === void 0 ? void 0 : _c.after).getTime())
                                            : now,
                                    },
                                },
                            },
                        ],
                    },
                },
                sort: [
                    {
                        date: { order: 'desc' },
                    },
                ],
                size: (_d = params.take) !== null && _d !== void 0 ? _d : 100,
            },
        });
        try {
            return result.body.hits.hits.map((item) => (Object.assign(Object.assign({}, item._source), { id: item._id })));
        }
        catch (error) { }
        return [];
    }
    cleanScopesForGroup(groupId, scopes) {
        if (!Array.isArray(scopes))
            return [];
        return scopes
            .map((scope) => {
            if (typeof scope === 'string') {
                if (!scope.startsWith(`group-${groupId}:`))
                    scope = `group-${groupId}:${scope}`;
                return scope;
            }
        })
            .filter((scope) => !!scope);
    }
    cleanScopesForUser(userId, scopes) {
        if (!Array.isArray(scopes))
            return [];
        return scopes
            .map((scope) => {
            if (typeof scope === 'string') {
                if (!scope.startsWith(`user-${userId}:`))
                    scope = `user-${userId}:${scope}`;
                return scope;
            }
        })
            .filter((scope) => !!scope);
    }
    async getApiKeyScopesForGroup(groupId) {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d, e_6, _e;
        var _f, _g, _h;
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            select: { attributes: true },
        });
        const attributes = group.attributes;
        const scopes = {};
        scopes[`read-info`] = 'Read group details';
        scopes[`write-info`] = 'Update group details';
        scopes[`delete`] = 'Delete group';
        scopes[`write-membership-*`] = 'Invite and update members';
        scopes[`read-membership-*`] = 'Read members';
        try {
            for (var _j = __asyncValues(await this.prisma.membership.findMany({
                where: { group: { id: groupId } },
                select: { id: true, user: true },
            })), _k; _k = await _j.next(), !_k.done;) {
                const membership = _k.value;
                scopes[`read-membership-${membership.id}`] = `Read membership: ${membership.user.name}`;
                scopes[`write-membership-${membership.id}`] = `Update membership: ${membership.user.name}`;
                scopes[`delete-membership-${membership.id}`] = `Delete membership: ${membership.user.name}`;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_k && !_k.done && (_a = _j.return)) await _a.call(_j);
            }
            finally { if (e_2) throw e_2.error; }
        }
        scopes[`write-api-key-*`] = 'Create and update API keys';
        scopes[`read-api-key-*`] = 'Read API keys';
        try {
            for (var _l = __asyncValues(await this.prisma.apiKey.findMany({
                where: { group: { id: groupId } },
                select: { id: true, name: true, apiKey: true },
            })), _m; _m = await _l.next(), !_m.done;) {
                const apiKey = _m.value;
                scopes[`read-api-key-${apiKey.id}`] = `Read API key: ${(_f = apiKey.name) !== null && _f !== void 0 ? _f : apiKey.apiKey}`;
                scopes[`write-api-key-${apiKey.id}`] = `Write API key: ${(_g = apiKey.name) !== null && _g !== void 0 ? _g : apiKey.apiKey}`;
                scopes[`delete-api-key-${apiKey.id}`] = `Delete API key: ${(_h = apiKey.name) !== null && _h !== void 0 ? _h : apiKey.apiKey}`;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_m && !_m.done && (_b = _l.return)) await _b.call(_l);
            }
            finally { if (e_3) throw e_3.error; }
        }
        scopes[`write-webhook-*`] = 'Create and update webhooks';
        scopes[`read-webhook-*`] = 'Read webhooks';
        try {
            for (var _o = __asyncValues(await this.prisma.webhook.findMany({
                where: { group: { id: groupId } },
                select: { id: true, url: true },
            })), _p; _p = await _o.next(), !_p.done;) {
                const webhook = _p.value;
                scopes[`read-webhook-${webhook.id}`] = `Read webhook: ${webhook.url}`;
                scopes[`write-webhook-${webhook.id}`] = `Write webhook: ${webhook.url}`;
                scopes[`delete-webhook-${webhook.id}`] = `Delete webhook: ${webhook.url}`;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_p && !_p.done && (_c = _o.return)) await _c.call(_o);
            }
            finally { if (e_4) throw e_4.error; }
        }
        scopes[`write-billing`] = 'Write billing details';
        scopes[`read-billing`] = 'Read billing details';
        scopes[`delete-billing`] = 'Delete billing details';
        scopes[`read-invoice-*`] = 'Read invoices';
        if (attributes === null || attributes === void 0 ? void 0 : attributes.stripeCustomerId)
            try {
                for (var _q = __asyncValues(await this.stripeService.getInvoices(groupId, {})), _r; _r = await _q.next(), !_r.done;) {
                    const invoice = _r.value;
                    scopes[`read-invoice-${invoice.id}`] = `Read invoice: ${invoice.number}`;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_r && !_r.done && (_d = _q.return)) await _d.call(_q);
                }
                finally { if (e_5) throw e_5.error; }
            }
        scopes[`write-source-*`] = 'Write payment methods';
        scopes[`read-source-*`] = 'Read payment methods';
        if (attributes === null || attributes === void 0 ? void 0 : attributes.stripeCustomerId)
            try {
                for (var _s = __asyncValues(await this.stripeService.getSources(groupId, {})), _t; _t = await _s.next(), !_t.done;) {
                    const source = _t.value;
                    scopes[`read-source-${source.id}`] = `Read payment method: ${source.id}`;
                    scopes[`delete-source-${source.id}`] = `Delete payment method: ${source.id}`;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_t && !_t.done && (_e = _s.return)) await _e.call(_s);
                }
                finally { if (e_6) throw e_6.error; }
            }
        scopes[`read-audit-log-*`] = 'Read audit logs';
        return scopes;
    }
    async getApiKeyScopesForUser(userId) {
        var e_7, _a, e_8, _b, e_9, _c, e_10, _d, e_11, _e;
        var _f, _g, _h, _j, _k;
        const scopes = {};
        scopes[`read-info`] = 'Read user details';
        scopes[`write-info`] = 'Update user details';
        scopes[`deactivate`] = 'Deactivate user';
        scopes[`write-membership-*`] = 'Create new groups';
        scopes[`read-membership-*`] = 'Read group memberships';
        try {
            for (var _l = __asyncValues(await this.prisma.membership.findMany({
                where: { user: { id: userId } },
                select: { id: true, group: true },
            })), _m; _m = await _l.next(), !_m.done;) {
                const membership = _m.value;
                scopes[`read-membership-${membership.id}`] = `Read membership: ${membership.group.name}`;
                scopes[`write-membership-${membership.id}`] = `Update membership: ${membership.group.name}`;
                scopes[`delete-membership-${membership.id}`] = `Delete membership: ${membership.group.name}`;
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_m && !_m.done && (_a = _l.return)) await _a.call(_l);
            }
            finally { if (e_7) throw e_7.error; }
        }
        scopes[`write-email-*`] = 'Create and update emails';
        scopes[`read-email-*`] = 'Read emails';
        try {
            for (var _o = __asyncValues(await this.prisma.email.findMany({
                where: { user: { id: userId } },
                select: { id: true, email: true },
            })), _p; _p = await _o.next(), !_p.done;) {
                const email = _p.value;
                scopes[`read-email-${email.id}`] = `Read email: ${email.email}`;
                scopes[`delete-email-${email.id}`] = `Delete email: ${email.email}`;
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_p && !_p.done && (_b = _o.return)) await _b.call(_o);
            }
            finally { if (e_8) throw e_8.error; }
        }
        scopes[`read-session-*`] = 'Read sessions';
        try {
            for (var _q = __asyncValues(await this.prisma.session.findMany({
                where: { user: { id: userId } },
                select: { id: true, browser: true },
            })), _r; _r = await _q.next(), !_r.done;) {
                const session = _r.value;
                scopes[`read-session-${session.id}`] = `Read session: ${(_f = session.browser) !== null && _f !== void 0 ? _f : session.id}`;
                scopes[`delete-session-${session.id}`] = `Delete session: ${(_g = session.browser) !== null && _g !== void 0 ? _g : session.id}`;
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_r && !_r.done && (_c = _q.return)) await _c.call(_q);
            }
            finally { if (e_9) throw e_9.error; }
        }
        scopes[`read-approved-subnet-*`] = 'Read approvedSubnets';
        try {
            for (var _s = __asyncValues(await this.prisma.approvedSubnet.findMany({
                where: { user: { id: userId } },
                select: { id: true, subnet: true },
            })), _t; _t = await _s.next(), !_t.done;) {
                const subnet = _t.value;
                scopes[`read-approved-subnet-${subnet.id}`] = `Read subnet: ${subnet.subnet}`;
                scopes[`delete-approved-subnet-${subnet.id}`] = `Delete subnet: ${subnet.subnet}`;
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (_t && !_t.done && (_d = _s.return)) await _d.call(_s);
            }
            finally { if (e_10) throw e_10.error; }
        }
        scopes[`write-api-key-*`] = 'Create and update API keys';
        scopes[`read-api-key-*`] = 'Read API keys';
        try {
            for (var _u = __asyncValues(await this.prisma.apiKey.findMany({
                where: { user: { id: userId } },
                select: { id: true, name: true, apiKey: true },
            })), _v; _v = await _u.next(), !_v.done;) {
                const apiKey = _v.value;
                scopes[`read-api-key-${apiKey.id}`] = `Read API key: ${(_h = apiKey.name) !== null && _h !== void 0 ? _h : apiKey.apiKey}`;
                scopes[`write-api-key-${apiKey.id}`] = `Write API key: ${(_j = apiKey.name) !== null && _j !== void 0 ? _j : apiKey.apiKey}`;
                scopes[`delete-api-key-${apiKey.id}`] = `Delete API key: ${(_k = apiKey.name) !== null && _k !== void 0 ? _k : apiKey.apiKey}`;
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_v && !_v.done && (_e = _u.return)) await _e.call(_u);
            }
            finally { if (e_11) throw e_11.error; }
        }
        scopes[`delete-mfa-*`] = 'Disable multi-factor authentication';
        scopes[`write-mfa-regenerate`] = 'Regenerate MFA backup codes';
        scopes[`write-mfa-totp`] = 'Enable TOTP-based MFA';
        scopes[`write-mfa-sms`] = 'Enable SMS-based MFA';
        scopes[`write-mfa-email`] = 'Enable email-based MFA';
        return scopes;
    }
};
ApiKeysService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tokens_service_1.TokensService,
        stripe_service_1.StripeService,
        config_1.ConfigService,
        elasticsearch_service_1.ElasticSearchService])
], ApiKeysService);
exports.ApiKeysService = ApiKeysService;
//# sourceMappingURL=api-keys.service.js.map