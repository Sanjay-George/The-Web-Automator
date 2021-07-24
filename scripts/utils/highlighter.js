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