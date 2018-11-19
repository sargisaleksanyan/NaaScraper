const moment = require('moment');
const formater = {};

formater.formatDate = (date, currentFormat, toFormat) => {
    if (!toFormat) {
        toFormat = 'YYYY-MM-DD';
    }
    return moment(date, currentFormat).format(toFormat);
};

formater.getCurrentDate = () => {
    const currentDate = new Date();
    const dateNumber = currentDate.getTime();
    let date = currentDate.toISOString();
    date = formater.formatDate(date, "YYYY-MM-DD");
    return date;
};

module.exports = formater;