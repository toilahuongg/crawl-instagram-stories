import fs from "fs";
import path from "path";
import type { Page, Protocol } from "puppeteer";
import { createFolder, readCookie, writeCookie } from "./utils";
const FOLDER_CACHE = path.join(__dirname, '/cache');
export default class LoginManager {
    protected username;
    protected password;
    protected isLogged = false;
    protected cookies: Protocol.Network.Cookie[] = [];
    constructor(username: string, password: string) {
        this.username = username.replace('@', '(at)');
        this.password = password;
    }
    protected async loginWithCookies(page: Page | null, uri: string) {
        if (!page) throw new Error("The init() method has not been initialized!");
        if (!fs.existsSync(FOLDER_CACHE)) createFolder(FOLDER_CACHE);
        this.cookies = readCookie(`${this.username}.json`) as Protocol.Network.Cookie[];
        if (this.cookies) {
            await page.setCookie(...this.cookies);
            await page.goto(uri, { waitUntil: 'networkidle0' });
        }
    }
    protected async loginWithUP(page: Page | null, uri: string) {
        if (!page) throw new Error("The init() method has not been initialized!");
        this.isLogged = await this.loggedCheck(page);
        if (this.isLogged) return;
        await page.goto(uri, { waitUntil: 'networkidle0' });
        await page.type('input[name=username]', this.username);
        await page.type('input[name=password]', this.password);
        await page.click('button[type=submit]');
        await page.waitForNavigation();
        this.cookies = await page.cookies();
        writeCookie(`${this.username}.json`, JSON.stringify(this.cookies));
        this.isLogged = await this.loggedCheck(page);
        if (!this.isLogged) {
            throw new Error('Invalid username or password')
        }
    }
    protected getValueCookieByName(name: string) {
        return this.cookies.find(cookie => cookie.name === name)?.value;
    }

    private async loggedCheck(page: Page) {
        // Nếu tồn tại input[name=username] => chưa login
        try {
            await page.waitForSelector('input[name=username]', { timeout: 1000 });
            return false;
        } catch (err) {
            return true;
        }
    };
}