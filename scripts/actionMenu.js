class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu";
        this.configuration = {
            actionName: "",
            actionType: null,
            actionKey: "",
            actionTargetsMeta: {
                selectors: [],  // selectors of unique targets to act on
                actOnSimilarTargets: false, // to extend action to all similar targets
                maxActionCount: -1 // add max limit of similar elements of each target
            },
            actionTargets: [],
            labelTargetsMeta: {
                selectors: [],
            },
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
                        <input id="target-list" type="text" readonly value="${this.configuration.actionTargetsMeta.selectors[0]}">
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

                <a id="configure" class="button">Configure</a>
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
            // TODO: CHECK FOR DUPLICATE TARGETS
            if(!this.configuration.actionTargets.includes(e.target)) {
                this.configuration.actionTargetsMeta.selectors.push(targetQuerySelector);
                this.configuration.actionTargets.push(e.target);
            }
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
            if(!this.configuration.labelTargets.includes(labelQuerySelector)) { 
                this.configuration.labelTargetsMeta.selectors.push(labelQuerySelector);
                this.configuration.labelTargets.push(e.target);
            }
            document.querySelector("#label-list").value = labelQuerySelector;
        }
    };

    clearHighlight = (elements) => {
        // TODO: something's wrong with colors. Fix 
        elements.forEach(item => {
            Highlighter.resetHighlight(item);
        });
    };

    populateSimilarTargets = (targets, targetsMeta, elementType) => {
        if(targetsMeta.selectors.length === 0)   return targets;

        // // TODO: check all meta targets, not just first one
        // const targetsPath = targetsMeta.selectors;

        targets = DomUtils.findSimilarElements(targetsMeta.selectors);

        targets.forEach(item => {
            Highlighter.highlightElement(item, elementType);
        });

        return targets;
    };

    removeSimilarTargets = (targets, targetsMeta, elementType) => {
        if(targetsMeta.selectors.length === 0 || targets.length === 0)   return targets;
        
        targets.forEach(item => {
            Highlighter.resetHighlight(item);
        });

        targets = [];
        targetsMeta.selectors.forEach(selector => {
            targets.push(document.querySelector(selector));
        });

        targets.forEach(item => {
            Highlighter.highlightElement(item, elementType);
        });
        return targets;
    };


    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            actionName: document.querySelector("#action-name").value,
            actionKey: document.querySelector("#action-key").value,
            actionType: document.querySelector("#action-type").value
        };
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
        document.querySelector(`#${this.containerId} #sel-similar`).addEventListener("click", (e) => {
            e.stopPropagation();
            let { actionTargets, actionTargetsMeta, labelTargets, labelTargetsMeta } = this.configuration;
            if(e.target.checked) {
                actionTargets = this.populateSimilarTargets(actionTargets, actionTargetsMeta, Profiler.elementTypes.ACTION_TARGET);
                labelTargets = this.populateSimilarTargets(labelTargets, labelTargetsMeta, Profiler.elementTypes.ACTION_LABEL);
                actionTargetsMeta.actOnSimilarTargets = true;
            }
            else {
                actionTargets = this.removeSimilarTargets(actionTargets, actionTargetsMeta, Profiler.elementTypes.ACTION_TARGET);
                labelTargets = this.removeSimilarTargets(labelTargets, labelTargetsMeta,  Profiler.elementTypes.ACTION_LABEL);
                actionTargetsMeta.actOnSimilarTargets = false;
            }
            this.configuration = {
                ...this.configuration,
                actionTargets,
                labelTargets,
                actionTargetsMeta
            };
        });

        // clear action targets
        document.querySelector(`#${this.containerId} #clear-target`).addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.actionTargets);
            let {actionTargets, actionTargetsMeta} = this.configuration;
            this.configuration.actionTargets = [];
            this.configuration.actionTargetsMeta = { 
                ...actionTargetsMeta,
                selectors: [], 
                actOnSimilarTargets: false 
            };
            document.querySelector("#target-list").value = "";
        });
        
        // clear label targets
        document.querySelector("#clear-label").addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.labelTargets);
            let {labelTargets, labelTargetsMeta} = this.configuration;
            this.configuration.labelTargets = [];
            this.configuration.labelTargetsMeta = { 
                ...labelTargetsMeta,
                selectors: [], 
            };
            // this.configuration.labelTargets = [];
            // this.configuration.labelTargetsMeta = [];
            document.querySelector("#label-list").value = "";
        });

        // save action config
        document.querySelector("#configure-action > a#configure").addEventListener("click", async e => {
            var config = await window.getConfiguration();
            this.setBasicDetails();

            const {actionName, actionType, actionKey, actionTargetsMeta, labelTargetsMeta} = this.configuration;
            config.push({
                actionName, 
                actionType,
                actionKey,
                labelTargetsMeta,
                actionTargetsMeta,
            });
            await window.setConfiguration(config);
            this.close();
        });
    };

    close = () => {
        this.hideMenu();
        this.removeMenuListeners();  // TODO: CHECK IF WORKING
        Profiler.disableConfigurationMode();

        // TODO: also remove all highlights on all actions and labels
        // Todo: clear all meta info 
    };

    open = (event) => {     
        Profiler.enableConfigurationMode(event.target, Profiler.elementTypes.ACTION);

        // initialize configuration values 
        let {actionTargetsMeta, actionTargets} = this.configuration;
        actionTargets.push(event.target);
        actionTargetsMeta.selectors.push(DomUtils.getQuerySelector(event.target));
        // { selectors: [ DomUtils.getQuerySelector(event.target) ] };
        
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