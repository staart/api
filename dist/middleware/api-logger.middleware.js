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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiLoggerMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const elasticsearch_service_1 = require("../providers/elasticsearch/elasticsearch.service");
let ApiLoggerMiddleware = class ApiLoggerMiddleware {
    constructor(configService, elasticSearchService) {
        this.configService = configService;
        this.elasticSearchService = elasticSearchService;
    }
    use(req, res, next) {
        const config = this.configService.get('tracking');
        let date = new Date();
        res.on('finish', () => {
            var _a;
            const obj = {
                date,
                method: req.method,
                protocol: req.protocol,
                path: req.path,
                authorization: req.headers.authorization,
                duration: new Date().getTime() - date.getTime(),
                status: res.statusCode,
            };
            if (config.mode === 'all')
                this.elasticSearchService.index(config.index, obj);
            else if (config.mode === 'authenticated' && req.headers.authorization)
                this.elasticSearchService.index(config.index, obj);
            else if (config.mode === 'api-key' &&
                uuid_1.validate((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '')))
                this.elasticSearchService.index(config.index, obj);
        });
        next();
    }
};
ApiLoggerMiddleware = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        elasticsearch_service_1.ElasticSearchService])
], ApiLoggerMiddleware);
exports.ApiLoggerMiddleware = ApiLoggerMiddleware;
//# sourceMappingURL=api-logger.middleware.js.map