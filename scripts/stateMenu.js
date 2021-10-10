class StateMenu extends Menu {
    constructor() {
        super();
        this.containerId = "state-menu";
        this.configuration = {
            stateName: "",
            stateType: null,
            stateKey: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [], 
            finalLabels: [],
            selectSimilar: false,
            selectSiblings: false,    
            repeatCount: 0,
            maxTargetCount: -1
        }; 
    }

    renderMenu = () => {
        return `
            <div class="row">
                <div class="col12">
                    <h4>Configure State</h4>
                </div>
                <i class="small material-icons profile-close">close</i>
            </div>

            <form id='configure-state' class="row">
                <div class="input-field col5">
                    <label for="state-name">State*</label>
                    <input id="state-name" type="text">
                </div>

                <div class="input-field col4">
                    <label for="state-key">Key</label>
                    <input id="state-key" type="text">
                </div>

                <div class="input-field col3">
                    <select id="state-type">
                        <option value="" disabled selected>State Type</option>
                        <option value="1">Scrape Data</option>
                        <option value="2" disabled>Monitor Data</option>
                        <option value="3" disabled>Store console logs</option>
                    </select>
                </div>
                
                <div class="col9">
                    <div class="input-field">
                        <label for="target-list">State Target(s)</label>
                        <input id="target-list" type="text" readonly value="${this.configuration.selectedTargets[0]}">
                        <a id="clear-target"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                    <div class="input-field">
                        <label for="label-list">Label Target(s)</label>
                        <input id="label-list" type="text" readonly>
                        <a id="clear-label"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                </div>
                <div class="input-field col3" style="display: flex; align-items: center; flex-wrap: wrap;">
                    <div class="col12">
                        <label id="sel-similar">
                            <input type="checkbox"/>
                            <span>Select similar elements</span>
                        </label>
                    </div>    
                    <div class="col12">
                        <label id="sel-siblings">
                            <input type="checkbox"/>
                            <span>Select siblings</span>
                        </label>
                    </div>    
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

    stateTargetHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.STATE_TARGET);
        },
    
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
    
        handleSelection: (e) => {
            // TODO: HOW TO PREVENT REACT ROUTER?
            e.preventDefault();
            this.showMenu();
            
            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const targetQuerySelector = DomUtils.getQuerySelector(e.target);
            // TODO: CHECK FOR DUPLICATE TARGETS, check if logic works
            if(!this.configuration.finalTargets.includes(e.target)) {
                this.configuration.selectedTargets.push(targetQuerySelector);
                this.configuration.finalTargets.push(e.target);
            }
            document.querySelector("#target-list").value = targetQuerySelector;
        }
    };

    stateLabelHandlers = {
        handleMouseOver: (e) => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.STATE_LABEL);
        },
        handleMouseOut: (e) => {
            Highlighter.resetHighlight(e.target);
        },
        handleSelection: (e) => {
            // TODO: HOW TO PREVENT routing?
            // event listener is on document, hence routing already in progress by the time handler is hit
            e.preventDefault();
            this.showMenu();
            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

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
        this.removeSimilarTargets(finalTargets, selectedTargets, elementType);
    };


    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            stateName: document.querySelector("#state-name").value,
            stateKey: document.querySelector("#state-key").value,
            stateType: document.querySelector("#state-type").value
        };
    };

    validateConfig = () => {
        const {stateName, stateType, selectedTargets} = this.configuration;
        let errorMsg = "";
        if(!stateName.length) {
            errorMsg = "Enter stateName";
        }
        else if(!stateType) {
            errorMsg = "Select stateType"
        }
        else if(!selectedTargets.length) {
            errorMsg = "Select atleast one State Target";
        }

        return {
            isValid: errorMsg.length === 0,
            errorMsg  
        };
    };

    setMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // select state targets
        document.querySelector(`#${this.containerId} #target-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual target input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.stateTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.stateTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.stateTargetHandlers.handleSelection);
        });

        // select label targets
        document.querySelector(`#${this.containerId} #label-list`).addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("Individual label input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.stateLabelHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.stateLabelHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.stateLabelHandlers.handleSelection);
        });

        // select all similar siblings
        document.querySelector(`#${this.containerId} #sel-similar`).addEventListener("click", (e) => {
            e.stopPropagation();
            let { finalTargets, selectedTargets, finalLabels, selectedLabels, selectSimilar, selectSiblings } = this.configuration;
            const siblingCheckbox = document.querySelector(`#${this.containerId} #sel-siblings input`);
            if(e.target.checked) {
                finalTargets = this.populateSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                finalLabels = this.populateSimilarTargets(finalLabels, selectedLabels, Enum.elementTypes.STATE_LABEL);
                selectSimilar = true;
                selectSiblings = false;
                siblingCheckbox.checked = false;
            }
            else {
                finalTargets = this.removeSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                finalLabels = this.removeSimilarTargets(finalLabels, selectedLabels,  Enum.elementTypes.STATE_LABEL);
                selectSimilar = false;
            }
            this.configuration = {
                ...this.configuration,
                finalTargets,
                finalLabels,
                selectedTargets,
                selectSimilar,
                selectSiblings,
            };
        });

        // select siblings (DOM tree logic)
        document.querySelector(`#${this.containerId} #sel-siblings`).addEventListener("click", (e) => {
            e.stopPropagation();
            const similarCheckbox = document.querySelector(`#${this.containerId} #sel-similar input`);
            let { finalTargets, selectedTargets, finalLabels, selectedLabels, selectSimilar, selectSiblings } = this.configuration;

            if(e.target.checked) {
                // todo: populate sibling
                finalTargets = this.populateSiblings(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                finalLabels = this.populateSiblings(finalLabels, selectedLabels, Enum.elementTypes.STATE_LABEL);
                selectSimilar = false;
                selectSiblings = true;
                similarCheckbox.checked = false;
            }
            else {
                finalTargets = this.removeSiblings(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                finalLabels = this.removeSiblings(finalLabels, selectedLabels,  Enum.elementTypes.STATE_LABEL);
                selectSiblings = false;
            }
            this.configuration = {
                ...this.configuration,
                finalTargets,
                finalLabels,
                selectedTargets,
                selectSimilar,
                selectSiblings,
            };
        });

        // clear state targets
        document.querySelector(`#${this.containerId} #clear-target`).addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.finalTargets); // todo: NOT WORKING PROPERLY, COLOR STILL SHOWN
            this.configuration.finalTargets = [];
            this.configuration.selectedTargets = [];
            document.querySelector("#target-list").value = "";
        });
        
        // clear label targets
        document.querySelector("#clear-label").addEventListener("click", (e) => {
            this.clearHighlight(this.configuration.finalLabels); // TODO: not working properly
            this.configuration.finalLabels = [];
            this.configuration.selectedLabels = [];
            document.querySelector("#label-list").value = "";
        });

        // save state config
        document.querySelector("#configure-state > a#configure").addEventListener("click", async e => {
            this.setBasicDetails();
            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                document.querySelector("#error-msg").innerHTML = errorMsg;
                return ;
            }
            const { stateName, stateType, stateKey, selectedTargets, selectedLabels, selectSimilar, selectSiblings } = this.configuration;
            await StateChain.push({
                stateName, 
                stateType,
                stateKey,
                selectedLabels,
                selectedTargets,
                selectSimilar,
                selectSiblings,
            });
            this.close();
        });
    };

    resetConfiguration = () => {
        this.configuration = {
            stateName: "",
            stateType: null,
            stateKey: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [],
            finalLabels: [],
            selectSimilar: false,    
            selectSiblings: false,    
            repeatCount: 0,
            maxTargetCount: -1
        }; 
    }

    close = () => {
        this.resetConfiguration();
        this.hideMenu();
        this.removeMenuListeners();  // TODO: Not implemented properly yet
        ConfigManager.disableConfigurationMode();
    };

    open = (target) => {     
        ConfigManager.enableConfigurationMode(target, Enum.elementTypes.STATE);

        // initialize configuration values 
        let {selectedTargets, finalTargets} = this.configuration;
        finalTargets.push(target);
        selectedTargets.push(DomUtils.getQuerySelector(target));
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();
        this.setMenuListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}
