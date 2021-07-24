const DomUtils = (() => {

    const buildSelector = (element) => {
        let elementPath = `${element.nodeName.toLowerCase()}`;
        if(element.classList.length)
            elementPath += `.${element.classList.value.replace(/\s/gi, '.')}`;
        return elementPath;
    };

    const getElementPathSelectors = (pathList, maxHeight) => {
        // pathList =  event.path 

        let finalPathList = [];
        for (let i = 0; i < pathList.length; i++) {
            if(i === maxHeight)     
                break;
            if(pathList[i].nodeName.toLowerCase() === "body")   
                break;
            finalPathList.push(pathList[i]);
        }
        return finalPathList.reverse().map(item => buildSelector(item)).join(" > ");
    };

    return {
        getElementPathSelectors,
    }
})();