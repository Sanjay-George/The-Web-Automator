const express = require('express');
const app = express();
const port = 5000;
const crawlersDL = require("./libs/database/crawlersDL");
const path = require('path');
const fs = require('fs');
const { crawlerStatus } = require("./libs/common/enum");
const {configure} = require("./libs/configuration/index");
const {init} = require("./libs/automation/web-scraper");

app.use(express.json()); 

app.get('/api/crawlers/', async (req, res) => {
    try{
        let crawlerList = await crawlersDL.getAll();
        res.send(JSON.stringify(crawlerList));
    }
    catch(ex) {
        console.error(ex);
		res.sendStatus(500);
    }
});

app.post('/api/crawlers/configure/:id', async (req, res) => {
    let crawler = await crawlersDL.get(req.params.id);

    if(crawler === undefined)    return;
    configure(crawler);
	res.sendStatus(200);
});

app.post('/api/crawlers/run/:id', async (req, res) => {
    let crawler = await crawlersDL.get(req.params.id);

    if(crawler === undefined)    return;
	init(crawler);
	res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Node server listening on port: ${port}`);
});