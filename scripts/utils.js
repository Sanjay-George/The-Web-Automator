const Utils = (() => {

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

const DynamicEventHandler = (() => {
    const handlers = {
        "mouseover": [],
        "mouseout": [],
        "click": []
    };

    const addHandler = (eventType, handler) => {
        if(!eventType)  return;
        if(typeof handler !== "function")   return;

        if(handlers[eventType].length > 0) {
            console.log(handlers[eventType][handlers[eventType].length - 1]);
            document.removeEventListener(eventType, handlers[eventType][handlers[eventType].length - 1]);
        }
        handlers[eventType].push(handler);
        document.addEventListener(eventType, handler);
    };

    const removeHandler = (eventType) =>  {
        if(!eventType)  return;
        if(handlers[eventType].length === 0)        return;

        var lastHandler = handlers[eventType].pop();
        console.log(lastHandler);
        document.removeEventListener(eventType, lastHandler);
        document.addEventListener(eventType, handlers[eventType][handlers[eventType].length - 1]);
    }; 

    return {
        addHandler,
        removeHandler
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

        if(!element.style.prevBorder)
            element.style.prevBorder = [];

        element.style.prevBorder.push(element.style.border);
        element.style.border = `2px solid rgb(${red}, ${green}, ${blue})`;

        if(!element.style.prevBackgroundColor) 
            element.style.prevBackgroundColor = [];
        
        element.style.prevBackgroundColor.push(element.style.backgroundColor);
        element.style.backgroundColor = `rgb(${red}, ${green}, ${blue}, 0.10)`; 
    };

    const resetHighlight = (element) => {
        element.style.border = element.style.prevBorder ? element.style.prevBorder.pop() : "";
        element.style.backgroundColor = element.style.prevBackgroundColor ? element.style.prevBackgroundColor.pop() : "";
    };

    return {
        resetHighlight,
        highlightElement,
        getColorsByType
    }
})();