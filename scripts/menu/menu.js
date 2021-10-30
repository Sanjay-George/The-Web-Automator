class Menu {

    createOverlay = () => {
        if(document.getElementById("profile-overlay")) {
            this.overlay = document.getElementById("profile-overlay");
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "profile-overlay";
        overlay.classList.add("profile-overlay");
        overlay.classList.add("hide");
        document.body.append(overlay);
        this.overlay = overlay;
    };

    createMenuElement = (id) => {
        if(document.getElementById(id))
            return;

        const menu = document.createElement("div");
        menu.classList.add("profile-menu");
        menu.classList.add("card");
        menu.classList.add("hide");
        menu.id = id;
        document.body.append(menu);
        this.menu = menu;
    };

    showMenu = () => {
        this.menu.classList.remove("hide");
        this.overlay.classList.remove("hide");
    };

    hideMenu = () => {
        this.overlay.classList.add("hide");
        this.menu.classList.add("hide");
    };

    clearHighlight = (elements) => {
        // TODO: something's wrong with colors. Fix 
        elements.forEach(item => {
            Highlighter.resetHighlight(item);
        });
    };

    populateSimilarTargets = (finalTargets, selectedTargets, elementType) => {  // TODO: REFACTOR THIS, REMOVE finalTargets
        if(selectedTargets.length === 0)   return finalTargets;

        finalTargets = DomUtils.findSimilarElements(selectedTargets);

        finalTargets.forEach(item => {
            Highlighter.highlightElement(item, elementType);
        });

        return finalTargets;
    };

    removeSimilarTargets = (finalTargets, selectedTargets, elementType) => {
        if(selectedTargets.length === 0 || finalTargets.length === 0)   return finalTargets;
        
        finalTargets.forEach(item => {
            Highlighter.resetHighlight(item);
        });

        finalTargets = [];
        selectedTargets.forEach(selector => {
            finalTargets.push(document.querySelector(selector));
        });

        finalTargets.forEach(item => {
            Highlighter.highlightElement(item, elementType);
        });
        return finalTargets;
    };

    populateSiblings = (finalTargets, selectedTargets, elementType) => {
        if(selectedTargets.length === 0)   return finalTargets;

        finalTargets = DomUtils.findSiblings(selectedTargets);

        finalTargets.forEach(item => {
            Highlighter.highlightElement(item, elementType);
        });

        return finalTargets;
    };

    removeSiblings = (finalTargets, selectedTargets, elementType) => {
        return this.removeSimilarTargets(finalTargets, selectedTargets, elementType);
    };


}

