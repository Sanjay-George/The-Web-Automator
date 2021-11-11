const DomUtils = (() => {

    const _startsWithNumber = str => {
        return !isNaN(parseInt(str[0]));   // first char in str is parseable 
    };

    const _buildId = element => {
        if(element.id === "")
            return "";

        let id = element.id;
        if(_startsWithNumber(id)) {   
            // https://stackoverflow.com/a/20306237/6513094
            id = `\\3${id.slice(0,1)} ${id.slice(1)}`;
        }

        return "#"+ id;
    }

    const _buildClassList = element => {
        if(element.classList.length === 0)
            return "";

        let classes = element.classList;
        let finalString = "";
        classes.forEach(className => {
            finalString += "." + className;
        })
        return finalString;
    };

    const _buildNthChild = element => {
        let childIndex = Array.from(element.parentElement.children).indexOf(element);
        return `:nth-child(${childIndex+1})`;
    };

    const hasSiblingsOfSameType = element => {
        let parent = element.parentElement;
        let currentType  = element.nodeName;
        let similarTypeChildren = Array.from(parent.children).map(ele => ele.nodeName).filter(nodeName => nodeName === currentType);
        return similarTypeChildren.length > 1;
    };

    const hasSiblingsWithSameClassList = element => {
        if(element.parentElement.children.length === 1) return false;

        const parent = element.parentElement;
        const siblings = Array.from(parent.children).filter(child => child !== element);
        const siblingsWithSameClassList = siblings.filter(sib => Array.from(sib.classList).sort().join(",") === Array.from(element.classList).sort().join(","));

        return (siblingsWithSameClassList.length > 0);
    }; 

    const hasClasses = element => {
        return element.classList.length > 0;
    };

    const hasId = element => {
        return element.id.length > 0;
    };

    const getQuerySelector = element => {
        if(element === undefined  || element === null)  return "";
        /*
        Logic: 
        1. Start with the element (lowest node)
        2. traverse parents ONLY upto the node where id is present. (coz id is unique)
        3. Use just nodeName, if there are no siblings of same type 
        4. Use classList, if no other siblings have the same class list (sort, join, and check)
        5. Use nth-child, if no classes present. (NOTE: nth-child is irrespective of the nodetype)
        */

        let path = [];        
        
        while(element !== document.body) {
            let currentSelector = element.nodeName.toLowerCase();

            if(hasId(element)) {
                currentSelector += `${_buildId(element)}`;
                path.push(currentSelector);
                break;
            }

            if(!hasSiblingsOfSameType(element)) {
                path.push(currentSelector);
                element = element.parentElement;
                continue;
            }
            
            if(hasClasses(element) && !hasSiblingsWithSameClassList(element)) {
                currentSelector += `${_buildClassList(element)}`;
                path.push(currentSelector);
                element = element.parentElement;
                continue;
            }

            currentSelector += `${_buildNthChild(element)}`;
            path.push(currentSelector);
            element = element.parentElement;
        }

        return path.reverse().join(" > ");
    }

    const formulateBestSelector = selector => {
        let matchedElementsCount = 0;
        const potentialSelectors = [];
        const selectorArr = selector.split(" > ");
        for(let i = 0; i < selectorArr.length; i++) {
            if(!selectorArr[i].includes("nth-child")){
                continue;
            }
            const newSelector = selectorArr.slice(0, i).concat(selectorArr.slice(i, i+1)[0].split(":")[0], selectorArr.slice(i+1, selectorArr.length)).join(" > ");  // Don't touch this. 
            potentialSelectors.push(newSelector);
        }

        let bestSelector = selector;
        for(let i = 0; i < potentialSelectors.length; i++) {
            const potentialSelector = potentialSelectors[i];
            const matchedElements = Array.from(document.querySelectorAll(potentialSelector));
            if(matchedElements.length >= matchedElementsCount) {
                bestSelector = potentialSelector;
                matchedElementsCount = matchedElements.length;
            }
        }

        return bestSelector;
    };

    const findSimilarElements = selectorArr => {
        let similarElements = [];
        selectorArr.forEach(selector => {
            const nthChildElem = selector.split(" > ").filter(item => item.includes("nth-child"));
            let newSelector;
            if(nthChildElem.length) {
                newSelector = formulateBestSelector(selector);
            } else {
                newSelector = selector;
            }   
            similarElements = similarElements.concat(Array.from(document.querySelectorAll(newSelector)));
        });
        return similarElements;
    };

    const findSiblings = selectorArr => {
        let siblings = [];
        selectorArr.forEach(selector => {
            siblings = siblings.concat(Array.from(document.querySelector(selector).parentElement.children));
        });
        return siblings;
    };

    const _unloadListener = () => {
        window.handlePageUnload();
    };

    const addUnloadListener = () => {
        window.addEventListener("beforeunload", _unloadListener);
    };

    const removeUnloadListener = () => {
        window.removeEventListener("beforeunload", _unloadListener);
    };

    const isValidQuerySelector = selector => {
        if(!selector || !selector.length)   return false;
        return document.querySelector(selector) !== null;
    };



    return {
        getQuerySelector,
        findSimilarElements,
        findSiblings,
        addUnloadListener,
        removeUnloadListener,
        isValidQuerySelector,
    }
})();