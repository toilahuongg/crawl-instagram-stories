import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import LoginManager from './login';
import type { TDataHighlight, TDataStory } from './type';
import { createFolder, downloadFile, getOptionsFetch } from './utils';

const INSTAGRAM = 'https://www.instagram.com';
const COUNT_PICK = 10;
export default class CrawlInstagram extends LoginManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: any = {};
  public folder: string | undefined;

  /**
   * 
   * @param username username of user instagram
   * @param password password of user instagram
   * @param folder folder wanna save file
   */
  constructor(username: string, password: string, folder?: string) {
    super(username, password);
    this.folder = folder;
  }
  async init() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.loginWithCookies(this.page, `${INSTAGRAM}/${this.username}`);
    if (this.folder) await this.exposeFunction(this.folder);
    this.options = getOptionsFetch(this.getValueCookieByName('csrfToken')!);
  }

  private exposeFunction(folder: string) {
    return this.page!.exposeFunction('saveFile', async (f: string, url: string) => {
      const F = path.join(folder, f)
      if (!fs.existsSync(F)) createFolder(F);
      const filePath = await downloadFile(F, url);
      return filePath;
    });
  }

  /**
   * 
   * @param username username of instagram
   * @returns
   */
  async getStories(username: string): Promise<TDataStory[]> {
    if (!this.page) throw new Error("The init() method has not been initialized!");
    await this.loginWithUP(this.page, `${INSTAGRAM}/${this.username}`);
    const uriInfoUsername = `${INSTAGRAM}/${username}/?__a=1`;
    const data = await this.page.evaluate(async (uriInfoUsername, options) => {
      try {
        const { id: userID, username } = await fetch(uriInfoUsername).then(res => res.json()).then(res => res.graphql.user);
        const result: TDataStory[] = await fetch(`https://i.instagram.com/api/v1/feed/user/${userID}/story/`, options)
          .then(res => res.json())
          .then((res) => Promise.all(res.reel?.items.map(async ({ image_versions2, video_versions }: { image_versions2: any, video_versions: any }) => {
            //@ts-ignore;
            const image = await window.saveFile(`${username}/images`, image_versions2.candidates[0].url);
            let video = '';
            //@ts-ignore;
            if (video_versions) video = await window.saveFile(`${username}/videos`, video_versions[0].url);
            return {
              image,
              video
            }
          })));
        return result;
      } catch {
        return [];
      }
    }, uriInfoUsername, this.options);
    return data;
  }
  
  /**
   * 
   * @param username username of instagram
   * @returns
   */
  async getHighlights(username: string): Promise<TDataHighlight[]> {
    if (!this.page) throw new Error("The init() method has not been initialized!");
    await this.loginWithUP(this.page, `${INSTAGRAM}/${this.username}`);
    const uriInfoUsername = `${INSTAGRAM}/${username}/?__a=1`;
    const data: TDataHighlight[] = await this.page.evaluate(async (uriInfoUsername, options, COUNT_PICK) => {
      const { id: userID, username } = await fetch(uriInfoUsername).then(res => res.json()).then(res => res.graphql.user);
      const reelIDs: string[] = await fetch(`https://i.instagram.com/api/v1/highlights/${userID}/highlights_tray/`, options)
        .then(res => res.json())
        .then((res) => res.tray.map(({ id }: { id: any }) => id));
      const result: TDataHighlight[] = [];
      while (reelIDs.length > 0) {
        const sliceReels = reelIDs.slice(0, COUNT_PICK);
        const reels = await fetch(`https://i.instagram.com/api/v1/feed/reels_media/?${sliceReels.map(id => 'reel_ids=' + id).join('&')}`, options)
          .then(res => res.json())
          .then((res) => res.reels);
        for (const id of sliceReels) {
          const reel = reels[id];
          const reelID = id.replace('highlight:', '');
          const data = await Promise.all(reel.items.map(async ({ image_versions2, video_versions }: { image_versions2: any, video_versions: any }) => {
            //@ts-ignore;
            const image = await window.saveFile(`${username}/hightlight/${reelID}/images`, image_versions2.candidates[0].url);
            let video = '';
            //@ts-ignore;
            if (video_versions) video = await window.saveFile(`${username}/hightlights/${reelID}/videos`, video_versions[0].url);
            return {
              image,
              video
            }
          }));
          // @ts-ignore
          const thumbnail = await window.saveFile(`${username}/hightlight/${reelID}/images`, reel.cover_media.cropped_image_version.url);
          result.push({
            title: reel.title,
            thumbnail: thumbnail,
            data
          });
        }
        reelIDs.splice(0,COUNT_PICK);
      }
      return result;

    }, uriInfoUsername, this.options, COUNT_PICK);
    return data;
  }
  async close() {
    this.browser?.close();
  }
}