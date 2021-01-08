"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const fs_1 = require("fs");
const helmet_1 = __importDefault(require("helmet"));
const path_1 = require("path");
const response_time_1 = __importDefault(require("response-time"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.use(helmet_1.default());
    app.enableCors();
    const pkg = JSON.parse(await fs_1.promises.readFile(path_1.join('.', 'package.json'), 'utf8'));
    const options = new swagger_1.DocumentBuilder()
        .setTitle('API')
        .setDescription('API description')
        .setVersion(pkg.version)
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, options);
    swagger_1.SwaggerModule.setup('api', app, document);
    app.setGlobalPrefix('v1');
    app.use(response_time_1.default());
    app.useStaticAssets(path_1.join(__dirname, '..', 'static'));
    await app.listen((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map