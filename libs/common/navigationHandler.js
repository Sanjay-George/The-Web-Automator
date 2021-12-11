// let xhrRequests = [];
let page;
let isNavigationInProgress = false;


function handlePageLoad() {
    isNavigationInProgress = false;
}

function handlePageUnload() {
    isNavigationInProgress = true;
}

async function addNavigationListener(pageObj) {
    page = pageObj;

    try { 
        await page.exposeFunction('handlePageUnload', handlePageUnload); 
    } catch(ex) {}

    page.on("load", handlePageLoad);
    page.evaluate(() => {
        DomUtils.addUnloadListener();
    });
}

function removeNavigationListener() {
    page.off("load", handlePageLoad);
    page.evaluate(() => {
        DomUtils.removeUnloadListener();
    });
}

function waitForNavigation() {
    return new Promise((resolve, reject) => {
        let timer = setInterval(() => {
            if(!isNavigationInProgress)   {  
                resolve(timer);
            }
        }, 100);
    });
}

async function awaitNavigation() {
    let timer = await waitForNavigation();
    clearInterval(timer);
}


module.exports = {
    addNavigationListener,
    removeNavigationListener,
    awaitNavigation,
    handlePageUnload,
}

