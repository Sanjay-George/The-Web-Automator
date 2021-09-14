class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu";
        this.configuration = {
            actionName: "",
            actionType: null,
            actionkey: "",
            actionTargetsMeta: [],
            actionTargets: [],
            labelTargetsMeta: [],
            labelTargets: [],
            // customInputs: []
        }; 
    }

    renderMenu = () => {
        return `
            <div class="row">
                <div class="col12">
                    <h4>Configure Action</h4>
                </div>
                <i class="small material-icons profile-close">close</i>
            </div>

            <form id='configure-action' class="row">
                <div class="input-field col5">
                    <label for="action-name">Action</label>
                    <input id="action-name" type="text">
                </div>

                <div class="input-field col4">
                    <label for="action-key">Key</label>
                    <input id="action-key" type="text">
                </div>

                <div class="input-field col3">
                    <select id="action-type">
                        <option value="" disabled selected>Action Type</option>
                        <option value="1">Click</option>
                        <option value="2" disabled>Text input</option>
                        <option value="3" disabled>Select</option>
                    </select>
                </div>
                
                <div class="col9">
                    <div class="input-field">
                        <label for="target-list">Action Target(s)</label>
                        <input id="target-list" type="text" readonly value="${this.configuration.actionTargetsMeta[0].selector}">
                        <a id="clear-target"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                    <div class="input-field">
                        <label for="label-list">Label Target(s)</label>
                        <input id="label-list" type="text" readonly>
                        <a id="clear-label"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                </div>
                <div class="input-field col3" style="display: flex; align-items: center;">
                    <label id="sel-similar">
                        <input type="checkbox"/>
                        <span>Select similar elements</span>
                    </label>
                </div>

                <!-- <div class="input-field col12">
                    <label for="custom-input">Custom Input (for autocomplete input)</label>
                    <input id="custom-input" type="text" class="validate">
                </div> -->

                <a class="button">Configure</a>
            </form>
        `;
    };

    removeMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);
    };
    
    showMenu = () => {
        this.menu.classList.remove("hide");
        this.overlay.classList.remove("hide");
    };

    hideMenu = () => {
        this.overlay.classList.add("hide");
        this.menu.classList.add("hide");
    };

    actionTargetHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Profiler.elementTypes.ACTION_TARGET);
        },
    
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
    
        handleSelection: (e) => {
            e.preventDefault();
            this.showMenu();
            DynamicEventHandler.removeHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.removeHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.removeHandler("click", this.actionTargetHandlers.handleSelection);

            const targetQuerySelector = DomUtils.getQuerySelector(e.target);
            this.configuration.actionTargetsMeta.push({ selector: targetQuerySelector });
            this.configuration.actionTargets.push(e.target);
            document.querySelector("#target-list").value = targetQuerySelector;
        }
    };

    actionLabelHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Profiler.elementTypes.ACTION_LABEL);
        },
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
        handleSelection: (e) => {
            e.preventDefault();
            this.showMenu();
            DynamicEventHandler.removeHandler("mouseover", this.actionLabelHandlers.handleMouseOver);
            DynamicEventHandler.removeHandler("mouseout", this.actionLabelHandlers.handleMouseOut);
            DynamicEventHandler.removeHandler("click", this.actionLabelHandlers.handleSelection);

            const labelQuerySelector = DomUtils.getQuerySelector(e.target);
            this.configuration.labelTargetsMeta.push({ selector: labelQuerySelector });
            this.configuration.labelTargets.push(e.target);
            document.querySelector("#label-list").value = labelQuerySelector;
        }
    };

    clearHighlight = (elements) => {
        // TODO: something's wrong with colors. Fix 
        elements.forEach(item => {
            Highlighter.resetHighlight(item);
        });
    };

    findSimilarElements = (selectorArr) => {
        let similarElements = [];
        selectorArr.forEach(selector => {
            const nthChildElem = selector.split(" > ").filter(item => item.includes("nth-child"));
            const replaceElem = nthChildElem[nthChildElem.length - 1];
            const newSelector = selector.replace(replaceElem, replaceElem.split(":")[0]);
            similarElements = similarElements.concat(Array.from(document.querySelectorAll(newSelector)));
        });
        return similarElements;
    };

    populateSimilarActionTargets = () => {
        if(this.configuration.actionTargetsMeta.length === 0)   return;

        // TODO: check all meta targets, not just first one
        const actionTargetsPath = this.configuration.actionTargetsMeta[0].selector;

        // TODO: improve this logic, remove nth child
        this.configuration.actionTargets = this.findSimilarElements([actionTargetsPath]);

        this.configuration.actionTargets.forEach(item => {
            Highlighter.highlightElement(item, Profiler.elementTypes.ACTION_TARGET);
        });
    };

    populateSimilarLabelTargets = () => {
        if(this.configuration.labelTargetsMeta.length === 0)    return;

        const labelTargetsPath = this.configuration.labelTargetsMeta[0].selector;

        this.configuration.labelTargets = this.findSimilarElements([labelTargetsPath]);

        this.configuration.labelTargets.forEach(item => {
            Highlighter.highlightElement(item, Profiler.elementTypes.ACTION_LABEL);
        });
    };

    setMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // select action targets
        document.querySelector(`#${this.containerId} #target-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual target input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionTargetHandlers.handleSelection);
        });

        // select label targets
        document.querySelector(`#${this.containerId} #label-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual label input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.actionLabelHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionLabelHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionLabelHandlers.handleSelection);
        });

        // select all similar siblings
        document.querySelector("#sel-similar").addEventListener("click", (e) => {
            e.stopPropagation();
            this.populateSimilarActionTargets();
            this.populateSimilarLabelTargets();
        });

        // clear action targets
        document.querySelector("#clear-target").addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.actionTargets);
            this.configuration.actionTargets = [];
            this.configuration.actionTargetsMeta = [];
            document.querySelector("#target-list").value = "";
        });
        
        // clear label targets
        document.querySelector("#clear-label").addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.labelTargets);
            this.configuration.labelTargets = [];
            this.configuration.labelTargetsMeta = [];
            document.querySelector("#label-list").value = "";
        });

        // save config
    };

    close = (event) => {
        this.hideMenu();
        this.removeMenuListeners();  // TODO: CHECK IF WORKING
        Profiler.disableConfigurationMode();

        // TODO: also remove all highlights on all actions and labels
        // Todo: clear all meta info 
    };

    open = (event) => {     
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);

        // initialize configuration values 
        this.configuration.actionTargetsMeta =  [{ selector: DomUtils.getQuerySelector(event.target) }];
        this.configuration.actionTargets = [event.target];
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();
        this.setMenuListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}



/*
On clicking shift + left mouse on element, popup opens actionMenu.open()
    - set first action target in list 
On clicking action target / label target, should give option to add more target
Delete button to clear selected targets
Close btn => close popup, remove all highlights
*/