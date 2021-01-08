"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtableModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const airtable_service_1 = require("./airtable.service");
let AirtableModule = class AirtableModule {
};
AirtableModule = __decorate([
    common_1.Module({
        imports: [config_1.ConfigModule],
        providers: [airtable_service_1.AirtableService],
        exports: [airtable_service_1.AirtableService],
    })
], AirtableModule);
exports.AirtableModule = AirtableModule;
//# sourceMappingURL=airtable.module.js.map