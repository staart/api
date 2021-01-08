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
var GoogleMapsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapsService = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GoogleMapsService = GoogleMapsService_1 = class GoogleMapsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleMapsService_1.name);
        this.config = this.configService.get('googleMaps');
        if (this.config.apiKey)
            this.client = new google_maps_services_js_1.Client();
        else
            this.logger.warn('Google Maps API key not found');
    }
    autocomplete(query, components) {
        return this.client.placeAutocomplete({
            params: {
                input: query,
                key: this.config.apiKey,
                components,
            },
        });
    }
};
GoogleMapsService = GoogleMapsService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleMapsService);
exports.GoogleMapsService = GoogleMapsService;
//# sourceMappingURL=google-maps.service.js.map