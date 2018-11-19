const axios = require('axios');
const querystring = require('querystring');
const mainUrl = "https://www.naa-amx.com/ip/";
const loginUrl = "https://www.naa-amx.com/ip/index.php?mod=login";
const FormData = require('form-data');
var URLSearchParams = require('url-search-params');
//1. make request to  "https://www.naa-amx.com/ip/"  and  get ref
//2. make
const scraper = {};

scraper.scrap = async (userName, password) => {
    //amxportal=UmljaGFyZE0sYzc5N2ViNTdiNmVmNWJkMjBjYjdlNTdlYWFjZGYzM2E4YThiMzgxMTllYmYxYWRkZTgwMTIyYTQyZWY4NWFjMCww
   // amxportal=UmljaGFyZE0sYzc5N2ViNTdiNmVmNWJkMjBjYjdlNTdlYWFjZGYzM2E4YThiMzgxMTllYmYxYWRkZTgwMTIyYTQyZWY4NWFjMCww;
    const cookies = await getCookies(userName, password);

};



const getCookies = async (userName, password) => {

    const response = await axios.get(mainUrl, {withCredentials: true});
    const {request} = response;
    const {path} = request;
    const responseHeader = response.headers;
    let cookies = extractCookiesFromString(responseHeader);

    const refererUrl = "https://www.naa-amx.com/" + path;
    const headers = {
        "Origin": "https://www.naa-amx.com",
        "Cookie": cookies,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": refererUrl,
    };

    try {
        const login = await axios({
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
    } catch (e) {
        const currentResponse = e.response;
        const {status} = currentResponse;
        if (status == 302) {
            const currentHeaders = currentResponse.headers;
            const currentCookies = extractCookiesFromString(currentHeaders);
            let tempCookie = cookies;
            if (tempCookie.charAt(tempCookie.length) != ';') {
                tempCookie = tempCookie + ";";
            }
            tempCookie = tempCookie + currentCookies;
            try {
                const new_headers = {
                    "Origin": "https://www.naa-amx.com",
                    "Cookie": tempCookie,
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
                let authCookie = extractCookiesFromString(newheaders);
                if(!authCookie.includes("PHPSESSID")){
                    if (cookies.charAt(cookies.length) != ';') {
                        cookies = cookies + ";";
                    }
                    authCookie = cookies+authCookie;
                }
                cookies = authCookie;
            } catch (e) {
                console.log(e);
            }
        }
    }
    return cookies;
};




const extractCookiesFromString = (responseHeader) => {
    const set_cookies = responseHeader['set-cookie'];
    let cookiesString = '';
    for (const cookie of set_cookies) {
        const currentCookieString = cookie.replace("; path=/", "");
        if (cookiesString.length > 0) {
            if (cookiesString.charAt(cookiesString.length - 1) != ';') {
                cookiesString = cookiesString + ";";
            }
        }
        cookiesString = cookiesString + currentCookieString;
    }
    return cookiesString;
};

module.exports = scraper;

