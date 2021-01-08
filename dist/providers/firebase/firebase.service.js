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
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let FirebaseService = FirebaseService_1 = class FirebaseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FirebaseService_1.name);
        this.client = firebase_admin_1.default;
        const config = this.configService.get('firebase');
        if (config.serviceAccountKey)
            this.client.initializeApp({
                credential: this.client.credential.cert(typeof config.serviceAccountKey === 'string'
                    ? JSON.parse(config.serviceAccountKey)
                    : config.serviceAccountKey),
                databaseURL: config.databaseUrl,
            });
        else
            this.logger.warn('Firebase API key not found');
    }
    async addCollectionItem(collectionName, data) {
        const reference = this.client.firestore().collection(collectionName);
        return reference.add(data);
    }
    async updateCollectionItem(collectionName, doc, data) {
        const reference = this.client
            .firestore()
            .collection(collectionName)
            .doc(doc);
        return reference.update(data);
    }
};
FirebaseService = FirebaseService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebase.service.js.map