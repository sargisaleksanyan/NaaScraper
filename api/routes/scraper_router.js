const Router =  require('koa-router');
const scraperRouter = new Router();
const scraper_controller = require('../../controller/scraper_controller');


//scraper route accepts requests and responses
//scraperRouter.post("/scrap", scraper_controller.scrap);
scraperRouter.post("/scrap", scraper_controller.scrap);

module.exports = scraperRouter;