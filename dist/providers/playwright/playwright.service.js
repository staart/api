"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightService = void 0;
const common_1 = require("@nestjs/common");
const playwright_1 = require("playwright");
let PlaywrightService = class PlaywrightService {
    constructor() {
        this.chromium = playwright_1.chromium;
        this.firefox = playwright_1.firefox;
        this.webkit = playwright_1.webkit;
    }
    async renderHtmlToImage(html, viewport) {
        const browser = await playwright_1.chromium.launch({
            executablePath: process.env.CHROMIUM_PATH,
            args: ['--no-sandbox'],
        });
        const page = await browser.newPage();
        if (viewport)
            await page.setViewportSize(viewport);
        await page.setContent(html, { waitUntil: 'networkidle' });
        const screenshot = await page.screenshot();
        await browser.close();
        return screenshot;
    }
    async renderHtmlToPdf(html, viewport, options) {
        const browser = await playwright_1.chromium.launch({
            executablePath: process.env.CHROMIUM_PATH,
            args: ['--no-sandbox'],
        });
        const page = await browser.newPage();
        if (viewport)
            await page.setViewportSize(viewport);
        await page.setContent(html, { waitUntil: 'networkidle' });
        const file = await page.pdf(options);
        await browser.close();
        return file;
    }
};
PlaywrightService = __decorate([
    common_1.Injectable()
], PlaywrightService);
exports.PlaywrightService = PlaywrightService;
//# sourceMappingURL=playwright.service.js.map