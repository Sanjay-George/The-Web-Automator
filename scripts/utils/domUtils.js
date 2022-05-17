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

    const _isValidClassName = className => {
        // https://stackoverflow.com/a/449000
        const classRegex = /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;
        return classRegex.test(className);
    };

    const _buildClassList = element => {
        if(element.classList.length === 0)
            return "";

        let classes = element.classList;
        let finalString = "";
        classes.forEach(className => {
            if(_isValidClassName(className)) {
                finalString += "." + className;
                return;
            }
            // TODO: add escape character for illegal classNames
            // eg: div.col-span-8.order-3.lg:order-none => div.col-span-8.order-3.lg\:order-none

        })
        return finalString;
    };

    const _buildNthChild = element => {
        let childIndex = Array.from(element.parentElement.children).indexOf(element);
        return `:nth-child(${childIndex+1})`;
    };

    const _hasSiblingsOfSameType = element => {
        let parent = element.parentElement;
        let currentType  = element.nodeName;
        let similarTypeChildren = Array.from(parent.children).map(ele => ele.nodeName).filter(nodeName => nodeName === currentType);
        return similarTypeChildren.length > 1;
    };

    const _hasSiblingsWithSameClassList = element => {
        if(element.parentElement.children.length === 1) return false;

        const parent = element.parentElement;
        const siblings = Array.from(parent.children).filter(child => child !== element);
        const siblingsWithSameClassList = siblings.filter(sib => Array.from(sib.classList).sort().join(",") === Array.from(element.classList).sort().join(","));

        return (siblingsWithSameClassList.length > 0);
    }; 

    const _hasClasses = element => {
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
            let nodeName = element.nodeName.toLowerCase();
            let currentSelector = nodeName;

            if(hasId(element)) {
                currentSelector += `${_buildId(element)}`;
                path.push(currentSelector);
                break;
            }

            if(!_hasSiblingsOfSameType(element)) {
                path.push(currentSelector);
                element = element.parentElement;
                continue;
            }
            
            if(_hasClasses(element) && !_hasSiblingsWithSameClassList(element)) {
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

    const _formulateBestSelector = selector => {
        let matchedElementsCount = 0;
        const potentialSelectors = [];
        const selectorArr = selector.split(" > ");
        for(let i = 0; i < selectorArr.length; i++) {
            if(!selectorArr[i].includes("nth-child")){
                continue;
            }
            const newSelector = 
                    selectorArr.slice(0, i)
                        .concat(selectorArr.slice(i, i+1)[0].split(":")[0], selectorArr.slice(i+1, selectorArr.length))
                        .join(" > ");  // Don't touch this. 
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
                newSelector = _formulateBestSelector(selector);
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

    const _formulateTreePath = selector => {
        let selectorPath = [];
        let element = document.querySelector(selector);

        while(element !== document.body) {
            const nodeName = element.nodeName.toLowerCase();
            const index = Array.from(element.parentElement.children).indexOf(element);
            selectorPath.push(`${nodeName}:nth-child(${index+1})`);
            element = element.parentElement;
        }
        selectorPath.push("body");
        selectorPath = selectorPath.reverse().join(" > ");
        return selectorPath;
    };

    // info: This logic was improved to handle following cases:
    // 1. similar elements having different classes 
    const findSimilarElementsByTreePath = selectorArr => {
        let similarElements = [];
        try {
            selectorArr.forEach(selector => {
                const treePath = _formulateTreePath(selector);  // create selector path with just nodeName and nth-child
                
                // TODO: FIX FLAW IN USING BEST SELECTOR, ie, selector that returns most elements
                // Eg: `div:nth-child(3) > ul > li:nth-child(3)`
                // if there are 4 li, and 8 div, it will remove nth-child from the div 
                // and return `div > ul > li:nth-child(3)`
                const bestSelector = _formulateBestSelector(treePath);  // get best selector (by removing nth-child)
                similarElements = similarElements.concat(Array.from(document.querySelectorAll(bestSelector)));
            });
            return similarElements;
        }
        catch(ex) {
            console.error(ex);
            return similarElements;
        }
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
        
        try {
            return document.querySelector(selector) !== null;
        }
        catch(ex)
        {
            if(ex.name === "SyntaxError") {
                return false;
            }
            console.error(ex);
        }
        return false;
    };

    const DomElements = (() => {
        const _copyAllProperties = (src, dest) => {
            dest.id = src.id;
            dest.classList = src.classList;
            dest.attributes = src.attributes;
            dest.onclick = src.onclick;
            dest.innerText = src.innerText;
            dest.innerHTML = src.innerHTML;
            dest.style = src.style;
            dest.href = src.href;
            dest.parentElement = src.parentElement;
        };
    
        const convertToNoLink = anchor => {
            if(!anchor || anchor.nodeName.toLowerCase() !== "a") {
                return { modifiedElement: anchor, isModified: false };
            }
    
            const noLink = document.createElement("no-link"); 
            _copyAllProperties(anchor, noLink); 
            anchor.replaceWith(noLink);
            return { modifiedElement: noLink, isModified: true }; 
        };
    
        const convertToAnchor = noLink => {
            if(!noLink || noLink.nodeName.toLowerCase() !== "no-link") {
                return { modifiedElement: noLink, isModified: false };
            }
    
            const anchor = document.createElement("a");  
            _copyAllProperties(noLink, anchor); 
            noLink.replaceWith(anchor);
            return { modifiedElement: anchor, isModified: true };
        };
    
        const convertAllTagsInPathToAnotherType = (element, fn) => {
            if(element === null || element === undefined)   return element;
            let traversedDistance = 0;
            let childIndexAtEachStep = [];
            
            while(element !== document.body) {
                const index  = Array.from(element.parentElement.children).indexOf(element);
                childIndexAtEachStep.push(index);
    
                const { modifiedElement, isModified } = fn(element);
                
                if(isModified) {
                    element.replaceWith(modifiedElement);  
                }
                element = modifiedElement.parentElement;
                traversedDistance++;
            }
    
            traversedDistance--;
    
            while(traversedDistance >= 0) {
                element = element.children[childIndexAtEachStep[traversedDistance]]
                traversedDistance--;
            }
    
            return element;
        };

        return {
            convertAllTagsInPathToAnotherType,
            convertToAnchor,
            convertToNoLink
        }
    })();

    const QuerySelectors = (() => {

        // regex to check for <a> or <no-link> = /^(a|no-link)([#.:].*|)$/
        const convertToNoLink = selector => {
            const anchorRegex = /^(a)([#.:].*|)$/;
            if(!selector || !selector.length || !anchorRegex.test(selector)) {
                return selector;
            }
            return selector.replace('a', 'no-link');
        };
    
        const convertToAnchor = selector => {
            const noLinkRegex = /^(no-link)([#.:].*|)$/;
            if(!selector || !selector.length || !noLinkRegex.test(selector)) {
                return selector;
            }
            return selector.replace('no-link', 'a');
        };
    
        const convertAllTagsInPathToAnotherType = (selector, fn) => {
            if(!selector || !selector.length)   return selector;
            
            const selectorList = selector.split(" > ");
            for (let i = 0;  i < selectorList.length; i++) {
                selectorList[i] = fn(selectorList[i]);
            }
            return selectorList.join(" > ")
        };

        return {
            convertAllTagsInPathToAnotherType,
            convertToAnchor,
            convertToNoLink
        }
    })();

    const setAnchorTargetTypeToSelf = element => {
        if(element.nodeName.toLowerCase() !== "a")  return false;

        if(element.target === "_blank") {
            element.target = "_self";
        }
        return true;
    }

    const sanitizeAnchorTags = targetSelector => {
        let element = document.querySelector(targetSelector);
        if(element === null)    return;

        if(setAnchorTargetTypeToSelf(element))    return;

        // TODO: check parent and children for anchor tags, coz click event propagates.
        while(element !== document.body) {
            element = element.parentElement;
            if (setAnchorTargetTypeToSelf(element))  return;        
        }

        element = document.querySelector(targetSelector);
        while(element.children.length) {
            element = element.children[0];
            if (setAnchorTargetTypeToSelf(element))  return;
        }
    };


    return {
        getQuerySelector,
        findSimilarElements,
        findSiblings,
        findSimilarElementsByTreePath,
        addUnloadListener,
        removeUnloadListener,
        isValidQuerySelector,
        // convertToNoLink,
        // convertToAnchor,
        // convertAllTagsInPathToAnotherType,
        sanitizeAnchorTags,
        setAnchorTargetTypeToSelf,
        DomElements,
        QuerySelectors,
    }
})();

