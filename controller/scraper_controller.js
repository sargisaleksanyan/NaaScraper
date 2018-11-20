const scraper = require('../scraper/scraper');

const scraperCtrl = {};

scraperCtrl.scrap = async (ctx) => {

  try {
      const query = ctx.request.body;

      const {credentials} = query;
      let {companies} = query;
      const {username} = credentials;
      const {pwd} = credentials;
      //const scrapedData = await scraper.scrap(username,pwd);
      let scrappedData = await scraper.scrap(username,pwd,companies);
      const {mode} = query;

      const outPut = {
        name:query.name,
        mode:mode,

        status:"ok"
      };
      if(mode==1){
         outPut['remits']  = await extractModeOne(scrappedData);
      }else{
        outPut['loansummary'] = scrappedData;
      }
      ctx.status = 200;
      ctx.body = outPut;
  }catch (e) {
      ctx.status = 500;
      ctx.body = {"Error":e};
  }

 // const scrapedData = scraper.scrap();
};


const extractModeOne = (loanSummaryList) => {
    const companies = {};
    //loanSummaryList.forEach(loanSummary=>{
    for (let i = 0; i < loanSummaryList.length; i++) {
        const loanSummary = loanSummaryList[i];
        const company = loanSummary['Company'];

            const address = loanSummary['Property Address'];
            const month = loanSummary['Month'];
            if (company && address) {
                if (!companies[company]) {
                    companies[company] = {};
                }
                if (!companies[company][address]) {
                    companies[company][address] = [];
                }
                companies[company][address].push(month);
            }

    }
    return companies;
};




module.exports = scraperCtrl;