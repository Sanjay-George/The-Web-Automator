let xhrRequests = [];
let page;
let status = {
    isXhrReadActive: true,
    isProfilingActive: false
};


function handleRequest(request) {
    if(!status.isXhrReadActive)             return;
    if(request.resourceType() !== "xhr")    return;
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
    if(xhrRequests.length > 0)
        xhrRequests = xhrRequests.slice(1, xhrRequests.length);        
    if(xhrRequests.length === 0)    
        status.isXhrReadActive = true;
}

function addXhrListener(pageObj) {
    page = pageObj;
    page.on("request", handleRequest);
}

function removeXhrListener() {
    page.off("request", handleRequest);
    page.off("response", handleResponse);
    xhrRequests = [];
}

function waitTillLastRequest() {
    let clearRequestTimer = setInterval(clearUnprocessedRequests, 5000);
    return new Promise((resolve, reject) => {
        let lastRequestTimer = setInterval(() => {
            if(xhrRequests.length === 0)   {  
                page.on("request", handleRequest);
                page.off("response", handleResponse);
                resolve({ lastRequestTimer, clearRequestTimer });
            }
        }, 100);
    });
}

async function awaitXhrResponse() {
    setTimeout(() => {
        page.off("request", handleRequest);
        status.isXhrReadActive = false;
        page.on("response", handleResponse);
    }, 30);   
    
    let { lastRequestTimer, clearRequestTimer } = await waitTillLastRequest();
    clearInterval(lastRequestTimer);
    clearInterval(clearRequestTimer);
    status.isXhrReadActive = true;
}


exports.addXhrListener = addXhrListener;
exports.removeXhrListener = removeXhrListener;
exports.awaitXhrResponse = awaitXhrResponse;