/// <reference types="node" />
export declare class PlaywrightService {
    chromium: import("playwright").BrowserType<import("playwright").ChromiumBrowser>;
    firefox: import("playwright").BrowserType<import("playwright").FirefoxBrowser>;
    webkit: import("playwright").BrowserType<import("playwright").WebKitBrowser>;
    renderHtmlToImage(html: string, viewport?: {
        width: number;
        height: number;
    }): Promise<Buffer>;
    renderHtmlToPdf(html: string, viewport?: {
        width: number;
        height: number;
    }, options?: {
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
    }): Promise<Buffer>;
}
