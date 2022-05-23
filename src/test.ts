import path from 'path';
import CrawlInstagram from '.';

(async () => {
  try {
    const crawl = new CrawlInstagram('your username...', 'password...', path.join(__dirname, 'images'));
    await crawl.init();
    console.time('getStories');
    await crawl.getStories('astock.authentic');
    console.timeEnd('getStories');
    console.time('getHighlights');
    await crawl.getHighlights('astock.authentic');
    console.timeEnd('getHighlights');
    crawl.close();
  } catch (error) {
    console.log(error);
  }
})()