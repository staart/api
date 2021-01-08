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
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = __importDefault(require("cloudinary"));
const stream_1 = require("stream");
class MultiStream extends stream_1.Readable {
    constructor(object, options = {}) {
        super();
        this._object = object;
        stream_1.Stream.Readable.call(this, {
            highWaterMark: options.highWaterMark,
            encoding: options.encoding,
        });
    }
    _read() {
        this.push(this._object);
        this._object = undefined;
    }
}
const createReadStream = (object, options) => new MultiStream(object, options);
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CloudinaryService_1.name);
        const config = this.configService.get('cloudinary');
        if (config.cloudName)
            cloudinary_1.default.v2.config({
                cloud_name: config.cloudName,
                api_key: config.apiKey,
                api_secret: config.apiSecret,
            });
        else
            this.logger.warn('Cloudinary API key not found');
    }
    upload(buffer, folder) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.v2.uploader.upload_stream({ folder }, (error, result) => {
                if (result)
                    return resolve(result);
                reject(error);
            });
            createReadStream(buffer).pipe(uploadStream);
        });
    }
};
CloudinaryService = CloudinaryService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudinaryService);
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinary.service.js.map