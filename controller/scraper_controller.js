const scraper = require('../scraper/scraper');

const scraperCtrl = {};

scraperCtrl.scrap = async (ctx) => {
    let outPut = {};
    let scrappedData = "";
    try {
        const query = ctx.request.body;
        const {credentials} = query;
        let {companies} = query;
        const {username} = credentials;
        const {pwd} = credentials;
        const {asset} = query;
        const {mode} = query;
        outPut = {
            name: query.name,
            mode: mode,
            status: "ok"
        };
        if (!companies && asset) {
            companies = [];
            companies.push(asset.company);
        }
        scrappedData = await scraper.scrap(username, pwd, companies);

        if (mode === 1) {
            outPut['remits'] = await extractModeOne(scrappedData);
        } else {
            outPut['loansummary'] = extractAsset(scrappedData, asset);
        }
        ctx.status = 200;
        ctx.body = outPut;
    } catch (e) {
        console.log(e);
        outPut.status = scrappedData;
        ctx.status = 500;
        ctx.body = outPut;
    }

};

const extractAsset = (loanSummaryList, asset) => {
    let desiredLoanSummary = {};
    for (let i = 0; i < loanSummaryList.length; i++) {
        const loanSummary = loanSummaryList[i];
        if ((loanSummary['Property Address'] == asset['address']) && (loanSummary['Month'] == asset['date'])) {
            desiredLoanSummary = loanSummary;
        }
    }
    return desiredLoanSummary;
};
/*

 */
/*
const extractModeOne = (loanSummaryList) => {
    const companies = {};
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
*/


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