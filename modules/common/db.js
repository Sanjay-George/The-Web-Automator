const mysql = require('mysql');
const { getConfigValue } = require('./common/configReader.js');

const dbConfig = getConfigValue("dbConfig");
const connection = mysql.createConnection({
  host     : dbConfig["host"] || 'localhost',
  port     : dbConfig["port"] || 3306,
  user     : dbConfig["user"] || 'root',
  password : dbConfig["password"] || 'admin123',
});


const closeConnection = () => {
    connection.end();
};


const getAllCrawlers = () => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM ${dbConfig["schema"]}.${dbConfig["table"]}`, function (error, results, fields) {
            if (error)  reject(error);
            try{
                const crawlerList = results.map(item => {
                    return {
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        config: item.config || "",
                        app: item.application,
                        lastStatus: item.lastStatus,
                        lastRun: item.lastRun
                    };
                });
                resolve(crawlerList);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    });
};

const getCrawler = id => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM ${dbConfig["schema"]}.${dbConfig["table"]} WHERE id=${id} LIMIT 1`, function (error, result, fields) {
            if (error)  reject(error);
            try{
                const crawlerDetails = {
                    id: result[0].id,
                    name: result[0].name,
                    url: result[0].url,
                    config: result[0].config,
                    app: result[0].application,
                    lastStatus: result[0].lastStatus,
                    lastRun: result[0].lastRun
                };
                resolve(crawlerDetails);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    });
};

const addCrawler = crawlerDetails => {
    return new Promise((resolve, reject) => {
        let data = {
            name: crawlerDetails.name,
            url: crawlerDetails.url,
            application: crawlerDetails.app,
            config: crawlerDetails.config
        };
        connection.query(`INSERT INTO ${dbConfig["schema"]}.${dbConfig["table"]} SET ?`, data, function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const updateStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE ${dbConfig["schema"]}.${dbConfig["table"]} SET lastStatus = ? WHERE id = ?`, [status, id], function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const updateCrawler = (id, crawlerDetails) => {
    return new Promise((resolve, reject) => {
        let data = {
            name: crawlerDetails.name,
            url: crawlerDetails.url,
            application: crawlerDetails.app,
            config: crawlerDetails.config,
            lastStatus: 0
        };
        connection.query(`UPDATE ${dbConfig["schema"]}.${dbConfig["table"]} SET ? WHERE id = ?`, [data, id], function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const deleteCrawler = id => {
    return new Promise((resolve, reject) => {
        connection.query(
          `DELETE FROM ${dbConfig["schema"]}.${dbConfig["table"]} WHERE id=${id}`,
          function (error, results, fields) {
            if (error) reject(error);
            resolve(results);
          }
        );
    });
};


exports.getAllCrawlers = getAllCrawlers;
exports.getCrawler = getCrawler;
exports.closeConnection = closeConnection;
exports.addCrawler = addCrawler;
exports.deleteCrawler = deleteCrawler;
exports.updateStatus = updateStatus;
exports.updateCrawler = updateCrawler;