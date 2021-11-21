const config = require("../../appsettings.json");

const getConfigValue = (key) => {
    return config[key];
};

module.exports = {
    getConfigValue
};