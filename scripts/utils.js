const Utils = (() => {

    const buildSelector = (element) => {
        let elementPath = `${element.nodeName.toLowerCase()}`;
        if(element.classList.length)
            elementPath += `.${element.classList.value.replace(/\s/gi, '.')}`;
        return elementPath;
    };

    const getElementPathSelectors = (event, maxHeight) => {
        const pathList = event.path

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


const Highlighter = (() => {
    const colors = {
        hover: [255, 213, 79],
        action: [3, 169, 244],
        actionLabel: [128, 222, 234],
        actionTarget: [100, 255, 218],
        state: [255, 82, 82]
    };

    const getColorsByType = (elementType) => {
        switch(elementType) {
            case Profiler.elementTypes.DEFAULT:
               return colors.hover;
            case Profiler.elementTypes.ACTION:
                return colors.action;
            case Profiler.elementTypes.ACTION_TARGET:
                return colors.actionTarget;
            case Profiler.elementTypes.ACTION_LABEL: 
                return colors.actionLabel;
            case Profiler.elementTypes.STATE:
                return colors.state;
            default:
                return colors.hover;
        }
    };

    const highlightElement = (element, elementType) => {
        const rgbValues = getColorsByType(elementType);

        const [red, green, blue] = rgbValues;
        element.style.prevBorder = element.style.border;
        element.style.border = `2px solid rgb(${red}, ${green}, ${blue})`;

        element.style.prevBackgroundColor = element.style.backgroundColor;
        element.style.backgroundColor = `rgb(${red}, ${green}, ${blue}, 0.10)`; 
    };

    const resetHighlight = (element) => {
        element.style.border = element.style.prevBorder;
        element.style.backgroundColor = element.style.prevBackgroundColor;
    };

    return {
        resetHighlight,
        highlightElement,
        getColorsByType
    }
})();