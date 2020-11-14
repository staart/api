import { Injectable } from '@nestjs/common';
import { chromium, firefox, webkit } from 'playwright';

@Injectable()
export class PlaywrightService {
  chromium = chromium;
  firefox = firefox;
  webkit = webkit;

  async renderHtmlToImage(
    html: string,
    viewport?: { width: number; height: number },
  ) {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    if (viewport) await page.setViewportSize(viewport);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const screenshot = await page.screenshot();
    await browser.close();
    return screenshot;
  }

  async renderHtmlToPdf(
    html: string,
    viewport?: { width: number; height: number },
    options?: {
      path?: string;
      scale?: number;
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
      printBackground?: boolean;
      landscape?: boolean;
      pageRanges?: string;
      format?: string;
      width?: string | number;
      height?: string | number;
      margin?: {
        top?: string | number;
        right?: string | number;
        bottom?: string | number;
        left?: string | number;
      };
      preferCSSPageSize?: boolean;
    },
  ) {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    if (viewport) await page.setViewportSize(viewport);
    await page.setContent(html, { waitUntil: 'networkidle' });
    const file = await page.pdf(options);
    await browser.close();
    return file;
  }
}
