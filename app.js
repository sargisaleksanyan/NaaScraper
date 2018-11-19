const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const Body = require('koa-body');
const Logger = require('koa-logger');
const ResponseTime = require('koa-response-time');


// ---------- Connect Middlewares ---------- //
app.use(ResponseTime());
app.use(Logger());
app.use(Body({
    extendTypes: {
        json: ['application/json'], // will parse application/x-javascript type body as a JSON string
    },
}));

// ---------- Set Header ------------------- //
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
    ctx.set('Access-Control-Allow-Headers', 'Origin, Accept, X-Requested-With, Content-Type, Authorization');

    if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
    } else {
        await next();
    }
});

// ------------Error Handler -------------//
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
      console.log('Error handler',err);
      ctx.status = err.statusCode || err.status || 500;
      ctx.body = {error:err.message||err};
    }
});

const mainRouter = new Router();

mainRouter.get('/',async(ctx)=>{
  ctx.status = 200;
  ctx.body = 'Connected';
});

//-----Load Routers --------//
const scraperRouter = require('./api/routes/scraper_router');

app.use(scraperRouter.routes());
//app.use(scraperRouter.routes());

module.exports = app;