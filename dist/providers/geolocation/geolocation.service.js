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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeolocationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const geolite2_redist_1 = __importDefault(require("geolite2-redist"));
const maxmind_1 = __importDefault(require("maxmind"));
const quick_lru_1 = __importDefault(require("quick-lru"));
let GeolocationService = class GeolocationService {
    constructor(configService) {
        var _a;
        this.configService = configService;
        this.lookup = null;
        this.lru = new quick_lru_1.default({
            maxSize: (_a = this.configService.get('caching.geolocationLruSize')) !== null && _a !== void 0 ? _a : 100,
        });
    }
    onModuleDestroy() {
        if (this.lookup)
            this.lookup = null;
    }
    async getLocation(ipAddress) {
        var _a;
        if (this.lru.has(ipAddress))
            return (_a = this.lru.get(ipAddress)) !== null && _a !== void 0 ? _a : {};
        const result = await this.getSafeLocation(ipAddress);
        this.lru.set(ipAddress, result);
        return result;
    }
    async getSafeLocation(ipAddress) {
        try {
            return this.getUnsafeLocation(ipAddress);
        }
        catch (error) {
            return {};
        }
    }
    async getUnsafeLocation(ipAddress) {
        var _a;
        if (!this.lookup)
            this.lookup = await geolite2_redist_1.default.open('GeoLite2-City', (path) => maxmind_1.default.open(path));
        return (_a = this.lookup.get(ipAddress)) !== null && _a !== void 0 ? _a : {};
    }
};
GeolocationService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeolocationService);
exports.GeolocationService = GeolocationService;
//# sourceMappingURL=geolocation.service.js.map