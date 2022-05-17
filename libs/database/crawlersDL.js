const mysql = require('mysql2');
const { getConfigValue } = require('../common/configReader.js');

const dbConfig = getConfigValue("dbConfig");
const connection = mysql.createConnection({
  host     : dbConfig["host"] || 'localhost',
  port     : dbConfig["port"] || 3306,
  user     : dbConfig["user"] || 'root',
  password : dbConfig["password"] || 'admin123',
});


const SCHEMA = "automator";
const TABLE = "crawlers";

const closeConnection = () => {
    connection.end();
};

const getAll = (pageNumber = 1, pageSize = 10) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id, name, url, configChain, status, status+0 as statusId, lastRun, isActive FROM ${SCHEMA}.${TABLE} WHERE isActive = 1`, function (error, results, fields) {
            if (error)  reject(error);
            try{
                resolve(results);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    });
};

const get = id => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM ${SCHEMA}.${TABLE} WHERE id=${id} LIMIT 1`, function (error, result, fields) {
            if (error)  reject(error);
            try{
                resolve(result[0]);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    });
};

const add = crawler => {
    return new Promise((resolve, reject) => {
        // let data = {
        //     name: crawlerDetails.name,
        //     url: crawlerDetails.url,
        //     status: crawlerDetails.app,
        //     config: crawlerDetails.config
        // };
        connection.query(`INSERT INTO ${SCHEMA}.${TABLE} SET ?`, crawler, function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const updateStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE ${SCHEMA}.${TABLE} SET status = ? WHERE id = ?`, [status, id], function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const update = (id, crawler) => {
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE ${SCHEMA}.${TABLE} SET ? WHERE id = ?`, [crawler, id], function (error, results, fields) {
            if (error)  reject(error);
            resolve(results);
        });
    });
};

const remove = id => {
    return new Promise((resolve, reject) => {
        connection.query(
          `DELETE FROM ${SCHEMA}.${TABLE} WHERE id=${id}`,
          function (error, results, fields) {
            if (error) reject(error);
            resolve(results);
          }
        );
    });
};


module.exports = {
    get,
    getAll,
    add,
    remove,
    update,
    updateStatus,
    closeConnection,
};