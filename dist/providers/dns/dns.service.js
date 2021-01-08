"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsService = void 0;
const common_1 = require("@nestjs/common");
const dns_1 = __importDefault(require("dns"));
let DnsService = class DnsService {
    async lookup(hostname, recordType) {
        try {
            return await this.unsafeLookup(hostname, recordType);
        }
        catch (error) {
            return [];
        }
    }
    unsafeLookup(hostname, recordType) {
        return new Promise((resolve, reject) => {
            dns_1.default.resolve(hostname, recordType, (error, records) => {
                if (error)
                    return reject(error);
                resolve(records);
            });
        });
    }
};
DnsService = __decorate([
    common_1.Injectable()
], DnsService);
exports.DnsService = DnsService;
//# sourceMappingURL=dns.service.js.map