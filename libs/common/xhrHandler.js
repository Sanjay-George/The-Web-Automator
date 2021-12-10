let xhrRequests = [];
let page;
let status = {
    isXhrReadActive: true,
    isProfilingActive: false
};

const MAX_WAIT_TIME = 5000;


function handleRequest(request) {
    if(!status.isXhrReadActive)             return;
    if(request.resourceType() !== "xhr" || request.resourceType() !== "fetch")    return;
    xhrRequests.push(request);
}

function handleResponse(response) {
    if(response.request().resourceType() !== "xhr")     return;
    if(xhrRequests.indexOf(response.request()) === -1)  return;

    xhrRequests = xhrRequests.filter(req => req !== response.request());

    if(xhrRequests.length === 0) {
        status.isXhrReadActive = true;
        return;
    }
}

function clearUnprocessedRequests() {
    // console.log('xhrRequest count: ', xhrRequests.length);
    if(xhrRequests.length > 0)
        xhrRequests = xhrRequests.slice(1, xhrRequests.length);    // remove first entry    
    if(xhrRequests.length === 0)    
        status.isXhrReadActive = true;
}


function waitTillLastRequest() {
    let clearRequestTimer = setInterval(clearUnprocessedRequests, 2000);
    let clearAllTimer = setInterval(() => { xhrRequests = []; }, MAX_WAIT_TIME);
    return new Promise((resolve, reject) => {
        let lastRequestTimer = setInterval(() => {
            if(xhrRequests.length === 0)   {  
                page.on("request", handleRequest);
                page.off("response", handleResponse);
                resolve({ lastRequestTimer, clearRequestTimer, clearAllTimer });
            }
        }, 100);
    });
}

function turnOffRequestMode() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            page.off("request", handleRequest);
            status.isXhrReadActive = false;
            page.on("response", handleResponse);
            resolve();
        }, 100); 
    });
}

async function addXhrListener(pageObj) {
    page = pageObj;
    await page.on("request", handleRequest);
}

async function removeXhrListener() {
    await page.off("request", handleRequest);
    await page.off("response", handleResponse);
    xhrRequests = [];
}

async function awaitXhrResponse() {
    await turnOffRequestMode();
    
    let { lastRequestTimer, clearRequestTimer, clearAllTimer } = await waitTillLastRequest();
    clearInterval(lastRequestTimer);
    clearInterval(clearRequestTimer);
    clearInterval(clearAllTimer);
    status.isXhrReadActive = true;
}


exports.addXhrListener = addXhrListener;
exports.removeXhrListener = removeXhrListener;
exports.awaitXhrResponse = awaitXhrResponse;