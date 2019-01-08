const scraper = require('../scraper/scraper');

const scraperCtrl = {};
const invalidAddress = 'Did not find any company with given address';
const invalidDate = 'Did not find any company with given date';

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
        };
        if (!companies && asset) {
            companies = [];
            companies.push(asset.company);
        }
        scrappedData = await scraper.scrap(username, pwd, companies);
        ctx.status = 200;
        if(scrappedData && scrappedData.status=="ok") {
            if (mode === 1) {
                outPut['remits'] = await extractModeOne(scrappedData.data);
            } else {
                outPut['loansummary'] = extractAsset(scrappedData.data, asset);
                if(typeof  outPut['loansummary'] ==="string" ){
                    ctx.status = 400,
                    scrappedData.status= "Failed";
                    let value = outPut["loansummary"];
                    delete outPut["loansummary"];
                    outPut.message = value
                }
            }
        }
        else {
            ctx.status = 400;
            outPut.message = scrappedData.message
        }
        outPut.status = scrappedData.status;


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
    let isThereProblemDate = false;
    for (let i = 0; i < loanSummaryList.length; i++) {
        const loanSummary = loanSummaryList[i];
        if ((loanSummary['Property Address'] == asset['address'])) {
            if((loanSummary['Month'] == asset['date'])){
                return loanSummary;
            } else {
                isThereProblemDate = true;
            }
        }
    }
    if(!isThereProblemDate){
        return invalidAddress;
    }else{
        return invalidDate;
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