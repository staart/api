import { Injectable } from '@nestjs/common';
import { launch, PDFOptions } from 'puppeteer';

@Injectable()
export class PuppeteerService {
  async renderHtmlToImage(
    html: string,
    viewport?: { width: number; height: number },
  ) {
    const browser = await launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    if (viewport) await page.setViewport(viewport);
    await page.setContent(html, { waitUntil: 'networkidle2' });
    const screenshot = await page.screenshot({ encoding: 'binary' });
    await browser.close();
    return screenshot;
  }

  async renderHtmlToPdf(
    html: string,
    viewport?: { width: number; height: number },
    options?: PDFOptions,
  ) {
    const browser = await launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    if (viewport) await page.setViewport(viewport);
    await page.setContent(html, { waitUntil: 'networkidle2' });
    const file = await page.pdf(options);
    await browser.close();
    return file;
  }
}
