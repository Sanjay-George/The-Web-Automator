class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu";
        this.configuration = {
            id: 0,
            name: "",
            type: null,
            key: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [],
            finalLabels: [],    
            repeatCount: 0,
            maxTargetCount: -1
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
                        <input id="target-list" type="text" readonly value="${this.configuration.selectedTargets[0]}">
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
                <div style="padding-left: 10px; padding-top: 10px; color: red" id="error-msg"></div>
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
            Highlighter.highlightElement(e.target, Enum.elementTypes.ACTION_TARGET);
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
            // TODO: CHECK FOR DUPLICATE TARGETS, check if logic works
            if(!this.configuration.finalTargets.includes(e.target)) {
                this.configuration.selectedTargets.push(targetQuerySelector);
                this.configuration.finalTargets.push(e.target);
            }
            document.querySelector("#target-list").value = targetQuerySelector;
        }
    };

    actionLabelHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.ACTION_LABEL);
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
            if(!this.configuration.finalLabels.includes(labelQuerySelector)) { 
                this.configuration.selectedLabels.push(labelQuerySelector);
                this.configuration.finalLabels.push(e.target);
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

    populateSimilarTargets = (finalTargets, selectedTargets, elementType) => {
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


    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            actionName: document.querySelector("#action-name").value,
            actionKey: document.querySelector("#action-key").value,
            actionType: document.querySelector("#action-type").value
        };
    };

    validateConfig = () => {
        const {actionName, actionType, actionKey, selectedTargets} = this.configuration;
        let errorMsg = "";
        if(!actionName.length || !actionKey.length) {
            errorMsg = "Enter actionName and actionKey";
        }
        else if(!actionType) {
            errorMsg = "Select actionType"
        }
        else if(!selectedTargets.length) {
            errorMsg = "Select atleast one Action Target";
        }

        return {
            isValid: errorMsg.length === 0,
            errorMsg  
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
            let { finalTargets, selectedTargets, finalLabels, selectedLabels } = this.configuration;
            if(e.target.checked) {
                finalTargets = this.populateSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = this.populateSimilarTargets(finalLabels, selectedLabels, Enum.elementTypes.ACTION_LABEL);
            }
            else {
                finalTargets = this.removeSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = this.removeSimilarTargets(finalLabels, selectedLabels,  Enum.elementTypes.ACTION_LABEL);
            }
            this.configuration = {
                ...this.configuration,
                finalTargets,
                finalLabels,
                selectedTargets
            };
        });

        // clear action targets
        document.querySelector(`#${this.containerId} #clear-target`).addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.finalTargets); // todo: NOT WORKING PROPERLY, COLOR STILL SHOWN
            let {selectedTargets} = this.configuration;
            this.configuration.finalTargets = [];
            this.configuration.selectedTargets = [];
            document.querySelector("#target-list").value = "";
        });
        
        // clear label targets
        document.querySelector("#clear-label").addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.finalLabels); // TODO: not working properly
            let {finalLabels, selectedLabels} = this.configuration;
            this.configuration.finalLabels = [];
            this.configuration.selectedLabels = [];
            document.querySelector("#label-list").value = "";
        });

        // save action config
        document.querySelector("#configure-action > a#configure").addEventListener("click", async e => {
            this.setBasicDetails();
            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                document.querySelector("#error-msg").innerHTML = errorMsg;
                return ;
            }

            const {actionName, actionType, actionKey, selectedTargets, selectedLabels} = this.configuration;
            const config = {
                actionName, 
                actionType,
                actionKey,
                selectedLabels,
                selectedTargets,
            };
            await ActionChain.push(config);
            this.close();
        });
    };

    resetConfiguration = () => {
        this.configuration = {
            actionName: "",
            actionType: null,
            actionKey: "",
            selectedTargets: [],
            finalTargets: [],
            selectedLabels: [],
            finalLabels: [],
            // customInputs: []
        }; 
    }

    close = () => {
        this.resetConfiguration();
        this.hideMenu();
        this.removeMenuListeners();  // TODO: Not implemented properly yet
        ConfigManager.disableConfigurationMode();
    };

    open = (event) => {     
        ConfigManager.enableConfigurationMode(event.target, Enum.elementTypes.ACTION);

        // initialize configuration values 
        let {selectedTargets, finalTargets} = this.configuration;
        finalTargets.push(event.target);
        selectedTargets.push(DomUtils.getQuerySelector(event.target));
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