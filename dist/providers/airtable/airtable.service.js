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
var AirtableService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const airtable_1 = __importDefault(require("airtable"));
let AirtableService = AirtableService_1 = class AirtableService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AirtableService_1.name);
        const config = this.configService.get('airtable');
        if (config.apiKey)
            this.client = new airtable_1.default({
                apiKey: config.apiKey,
                endpointUrl: config.endpointUrl,
            });
        else
            this.logger.warn('No Airtable API key set');
    }
};
AirtableService = AirtableService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AirtableService);
exports.AirtableService = AirtableService;
//# sourceMappingURL=airtable.service.js.map