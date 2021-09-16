const Highlighter = (() => {
    // const colors = {
    //     hover: [255, 213, 79],
    //     action: [3, 169, 244],
    //     actionLabel: [128, 222, 234],
    //     actionTarget: [100, 255, 218],
    //     state: [255, 82, 82]
    // };

    const colors = {
        hover: [255, 213, 79],
        action: [3, 169, 244],
        actionLabel: [255, 0, 0],
        actionTarget: [0, 0, 0],
        state: [255, 82, 82]
    };

    const getColorsByType = (elementType) => {
        switch(elementType) {
            case Enum.elementTypes.DEFAULT:
               return colors.hover;
            case Enum.elementTypes.ACTION:
                return colors.action;
            case Enum.elementTypes.ACTION_TARGET:
                return colors.actionTarget;
            case Enum.elementTypes.ACTION_LABEL: 
                return colors.actionLabel;
            case Enum.elementTypes.STATE:
                return colors.state;
            default:
                return colors.hover;
        }
    };

    const highlightedElements = [];
    const getAllHighlightedElements = () => highlightedElements;
    

    const highlightElement = (element, elementType, customColor = null) => {
        if(element === null || element === undefined)   return;
        highlightedElements.push(element);

        const rgbValues = customColor || getColorsByType(elementType);
        const [red, green, blue] = rgbValues;

        if(!element.style.prevBorder)
            element.style.prevBorder = [];

        element.style.prevBorder.push(element.style.border);
        element.style.border = `1px solid rgb(${red}, ${green}, ${blue})`;

        if(!element.style.prevBackgroundColor) 
            element.style.prevBackgroundColor = [];
        
        element.style.prevBackgroundColor.push(element.style.backgroundColor);
        element.style.backgroundColor = `rgb(${red}, ${green}, ${blue}, 0.10)`; 
    };

    const resetHighlight = (element) => {
        if(element === null || element === undefined)       return;
        element.style.border = element.style.prevBorder ? element.style.prevBorder.pop() : "transparent";
        element.style.backgroundColor = element.style.prevBackgroundColor ? element.style.prevBackgroundColor.pop() : "transparent";

        // if(!element.style.prevBorder || !element.style.prevBackgroundColor)     return;

        // remove first occ of element in highlightedElements[]
        const firstIndex = highlightedElements.indexOf(element);
        if(firstIndex > -1){
            highlightedElements.splice(firstIndex, 1);
        }
    };

    const resetAllHighlights = () => {
        while(highlightedElements.length) {
            resetHighlight(highlightedElements[0]);
        }
    };

    return {
        resetHighlight,
        highlightElement,
        getColorsByType,
        resetAllHighlights,
        getAllHighlightedElements,
    }
})();