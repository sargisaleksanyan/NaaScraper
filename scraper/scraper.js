const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');
const time_converter = require('./../util/time_converter');

const mainUrl = "https://www.naa-amx.com/ip/";
const loginUrl = "https://www.naa-amx.com/ip/index.php?mod=login";
const remitsEnterUrl = "https://www.naa-amx.com/ip/index.php?mod=remits&fn=consolidated";
const indexPhpUrl = "https://www.naa-amx.com/ip/index.php";
const scraper = {};

scraper.scrap = async (userName, password, givenCompanies) => {
    try {
        const cookies = await getLoginCookies(userName, password);
        if(typeof givenCompanies === 'undefined'){
            givenCompanies = null;
        }

        const companiesList = await getCompaniesList(cookies, givenCompanies);
        const companies = [];
        for (let i = 0; i < companiesList.length; i++) {
            companies.push(scrapComapnyDetails(companiesList[i], cookies));
        }
        const companyDetails = await Promise.all(companies);
        const parsedCompanies = await parseLoanSummry(companyDetails);
        // const mode = await extractModeOne(parsedCompanies);
        return parsedCompanies;
    } catch (e) {
        console.log(e);
    }
};


/*

this function parsed html and gets information we need from html code

*/


const parseLoanSummry = async (companiesDetails) => {
    const loanSummeryList = [];

    for (let i = 0; i < companiesDetails.length; i++) {


        const companyDetails = companiesDetails[i];
        for (let j = 0; j < companyDetails.length; j++) {
            const companyDetail = companyDetails[j];
            const headers = await extractHeaders(companyDetail);
            const tableData = await cheerio.load(companyDetail.html)(".tmain.sortable > tbody > tr ").find("td");

            if (tableData && tableData.length > 0) {
                const loanSummery = {};
                loanSummery['Company'] = companyDetail.company;
                const date = await getDateFromHtml(companyDetail.html);
                loanSummery['Month'] = date;
                for (let i = 0; i < headers.length; i++) {
                    try {
                        const tableHeader = tableData[i];
                        const text = await cheerio.load(tableHeader).text();
                        const tableHead = headers[i];
                        loanSummery[headers[i].text] = text;
                    } catch (e) {
                        console.log(companyDetail.name);
                        console.log("Erorr ", e);
                    }
                }
                loanSummeryList.push(loanSummery);
            }
        }
    }
    return loanSummeryList;
};

/*
 extracts date from html page
*/
const getDateFromHtml = async (html) => {

    const $ = await cheerio.load(html);
    //const summaryTable  = $("#contentRightMainContent > table:nth-child(1) > tbody > tr > td:nth-child(1) > table > tbody").find("tr");
    const summaryTable = $("#contentRightMainContent table tr");
    for (let i = 0; i < summaryTable.length; i++) {
        const tr = summaryTable[i];
        const tds = await cheerio.load(tr)("td");
        if (tds.length > 1) {
            const key = $(tds[0]).text();
            const dateString = 'Period Start Date';
            if (key == dateString || key.includes(dateString)) {
                return $(tds[1]).text()
            }
        }
    }
};

const extractHeaders = async (companiesDetail) => {
    const headers = [];
    const tableHeaders = cheerio.load(companiesDetail.html)(".tmain.sortable > thead > tr.tsub").find("td");
    for (let i = 0; i < tableHeaders.length; i++) {
        const tableHeader = tableHeaders[i];
        const text = cheerio.load(tableHeader).text();
        headers.push({index: i, text});

    }
    return headers;
};

/*
scraps given company `s loan and remits summery
*/

const scrapComapnyDetails = async (company, cookies) => {
    const remitsList = await getCompanyRemitsList(company, cookies);
    const companyRemitDetails = [];
    for (let i = 0; i < remitsList.length; i++) {
        companyRemitDetails.push(extractLoanSummary(remitsList[i], cookies));
    }
    return await Promise.all(companyRemitDetails);
};


const extractLoanSummary = async (remit, cookies) => {
    const url = `https://www.naa-amx.com/ip/index.php?mod=remits&fn=detail&xid=${remit.id}&tbl=LoanSummary`;
    const cookieString = extractCookiesFromObject(cookies);
    const headers = {
        "Referer": `https://www.naa-amx.com/ip/index.php?mod=remits&fn=summary&xid=${remit.id}`,
        "Cookie": cookieString,
    };
    const loanSummary = await axios({
        method: 'GET',
        url: url,
        withCredentials: true,
        headers: headers
    });
    return {
        html: loanSummary.data,
        company: remit.name
    }

};

const getCompanyRemitsList = async (company, cookies) => {
    const cookiesString = extractCookiesFromObject(cookies);
    const companiesList = [];
    const headers = {
        "Origin": "https://www.naa-amx.com",
        "Cookie": cookiesString,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": remitsEnterUrl,
    };
    // gets list of remits of all time from  2007-01-01 to current date
    try {
        const currentDate = time_converter.getCurrentDate();
        const remitis = await axios({
            method: 'post',
            url: remitsEnterUrl,
            data: querystring.stringify({
                relative: `2007-01-01,${currentDate}`,
                startdate: '2007-01-01',
                enddate: currentDate,
                codes: '',
                "ivids[]": company.value,
                search: ''
            }),
            withCredentials: true,
            headers
        });
        const $ = await cheerio.load(remitis.data);

        //https://www.naa-amx.com/ip/index.php?mod=remits&fn=summary&xid=4125
        const tableSummryList = $(".tmain.sortable > tbody > tr");
        for (let i = 0; i < tableSummryList.length; i++) {
            const table = tableSummryList[i];
            const tdLoader = cheerio.load(table);
            const tds = tdLoader('td');

            if (tds.length > 2) {
                try {
                    const td = tds[tds.length - 1];
                    const href = cheerio.load(td)("a").first().attr("href");
                    const id = tds.first().text();
                    companiesList.push({id, url: href, name: company.name});
                } catch (e) {
                    console.log(e);
                }
            }
        }

    } catch (e) {
        console.log(e);
    }
    return companiesList;
};

/*
 gets companies from  html document
*/
const getCompaniesList = async (cookies, companies) => {
    const cookieString = extractCookiesFromObject(cookies);
    const headers = {
        "Referer": indexPhpUrl,
        "Cookie": cookieString,
    };
    const response = await axios({
        method: 'GET',
        url: remitsEnterUrl,
        withCredentials: true,
        headers: headers
    });

    const $ = cheerio.load(response.data);
    const companyList = [];
    const companyNames = [];
    const companyElementList = $("#ivids").find("option");
    for (let i = 0; i < companyElementList.length; i++) {
        const companyElement = companyElementList[i];
        const value = $(companyElement).attr("value");
        let name = $(companyElement).text();

        if (companies) {
            if (companies.includes(name)) {
                companyList.push({name: name, value: value});
            }
        } else {
            const nameSubelements = name.split(" ");
            const lastPart = nameSubelements[nameSubelements.length - 1];
            if (lastPart.indexOf("(") > -1 && lastPart.indexOf(")") > -1) {
                name = name.replace(lastPart, "").trim();
            }
            if (!companyNames.includes(name)) {
                companyList.push({name: name, value: value});
                companyNames.push(name);
            }
        }
    }
    return companyList;
};

/*
this funcation extracts cookies that  we  get  when  login into account
*/
const getLoginCookies = async (userName, password) => {

    const response = await axios.get(mainUrl, {withCredentials: true});
    const {request} = response;
    const {path} = request;
    const responseHeader = response.headers;
    let cookiesObject = {};

    extractCookies(cookiesObject, responseHeader);
    let cookiesString = extractCookiesFromObject(cookiesObject);

    const refererUrl = "https://www.naa-amx.com/" + path;
    const headers = {
        "Origin": "https://www.naa-amx.com",
        "Cookie": cookiesString,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": refererUrl,
    };

    try {
        await axios({
            method: 'post',
            url: loginUrl,
            data: querystring.stringify({
                'username': userName,
                'password': password,
                "login": ""
            }),
            withCredentials: true,
            headers
        });
    }
        // in this case error is normal if the status code is 302
    catch (e) {
        const currentResponse = e.response;
        const {status} = currentResponse;
        if (status === 302) {
            const currentHeaders = currentResponse.headers;
            extractCookies(cookiesObject, currentHeaders);
            cookiesString = extractCookiesFromObject(cookiesObject);

            try {
                const new_headers = {
                    "Origin": "https://www.naa-amx.com",
                    "Cookie": cookiesString,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": refererUrl,
                };

                const loginAuth = await axios({
                    method: 'GET',
                    url: "https://www.naa-amx.com/ip/",
                    withCredentials: true,
                    headers: new_headers
                });

                const newheaders = loginAuth.headers;
                extractCookies(cookiesObject, newheaders);
            } catch (e) {
                console.log(e);
            }
        }
    }
    return cookiesObject;
};

// this function extracts cookies from response headers
const extractCookies = (cookies, responseHeader) => {
    const set_cookies = responseHeader['set-cookie'];

    for (const cookie of set_cookies) {
        const currentCookieString = cookie.replace("; path=/", "");
        const keyValueString = currentCookieString.split("=");
        if (keyValueString.length === 2) {
            cookies[keyValueString[0]] = keyValueString[1];
        }
    }
};

// this function gets string from object
const extractCookiesFromObject = (cookiesObject) => {
    let cookiesString = '';
    const cookies = Object.keys(cookiesObject);

    for (let i = 0; i < cookies.length; i++) {
        if (i > 0) {
            cookiesString = cookiesString + ";"
        }
        cookiesString = cookiesString + cookies[i] + "=" + cookiesObject[cookies[i]];
    }

    return cookiesString;
};

module.exports = scraper;

