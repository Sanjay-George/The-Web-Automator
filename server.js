const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const crawlersDL = require("./libs/database/crawlersDL");
const { crawlerStatus } = require("./libs/common/enum");
const {configure} = require("./libs/configuration/index");
const {init} = require("./libs/automation/web-scraper");

const app = express();
const port = 5000;

app.use(express.json());

// https://expressjs.com/en/resources/middleware/cors.html
app.use(cors());

// get all crawlers
app.get("/api/crawlers/", async (req, res) => {
    try{
        let crawlerList = await crawlersDL.getAll();
        res.send(JSON.stringify(crawlerList));
    }
    catch(ex) {
        console.error(ex);
		res.sendStatus(500);
    }
});

// add crawler
app.post("/api/crawlers/", async (req, res, next) => {
    if(Object.keys(req.body).length === 0) {
        res.sendStatus(400);
        return;
    }
    const { name, url } = req.body;
    if(!name.length || !url.length) {
        res.sendStatus(400);
        return;
    }
    const data = {
        name: name,
        url: url,
        status: crawlerStatus.NOT_CONFIGURED,
        lastRun: null
    };
    await crawlersDL.add(data);
	res.sendStatus(201);
});

// delete crawler
app.delete("/api/crawlers/:id", async (req, res, next) => {
    await crawlersDL.remove(req.params.id);
	res.sendStatus(200);
});

// initiate configuration mode
app.post("/api/crawlers/configure/:id", async (req, res) => {
    let crawler = await crawlersDL.get(req.params.id);

    if(crawler === undefined)    return;
    configure(crawler);
	res.sendStatus(200);
});


// run crawler
app.post("/api/crawlers/run/:id", async (req, res) => {
    let crawler = await crawlersDL.get(req.params.id);

    if(crawler === undefined)    return;
	init(crawler);
	res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Node server listening on port: ${port}`);
});