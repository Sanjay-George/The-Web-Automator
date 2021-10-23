class StateMenu extends Menu {
    constructor() {
        super();
        this.containerId = "state-menu";
        this.configuration = {
            configType: Enum.configTypes.STATE,
            stateName: "",
            stateType: null,
            stateKey: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [], 
            finalLabels: [],
            selectSimilar: false,
            selectSiblings: false,    
            // repeatCount: 0,  
            maxTargetCount: -1,
            // index of action to perform after. -1 means collect data immediately
            performAfter: -1,   

            // TODO: NEW PROPERTIES 
            collectionKey: "",
            selectedProperties: [],  // [{key: 'selector/text', value: 'selector'}, {}, ...]
            finalProperties: [],    // [{key: text/element, value: element}, {}, ...]
        };
        
        this.eventListenerTargets = {
            editKey: null,
            editValue: null,
            deleteProp: null,
            selectSimilar: null,
            selectSiblings: null
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
                <div class="input-field col6">
                    <label for="state-name">Name*</label>
                    <input id="state-name" type="text">
                </div>

                <div class="input-field col4">
                    <select id="state-type">
                        <option value="" disabled selected>State Type</option>
                        <option value="1">Scrape Data</option>
                        <option value="2" disabled>Monitor Data</option>
                        <option value="3" disabled>Store console logs</option>
                    </select>
                </div>

                <div class="input-field col8">
                    <label for="state-key">Collection Key*</label>
                    <input id="state-key" type="text">
                </div>

                <div class="input-field col4">
                    <select id="perform-after">
                        <option value="" disabled selected>Select when to perform state*</option>
                        <option value="-1">Perform immediately</option>
                        <optgroup label="Available actions" id="associated-action">
                        </optgroup>
                    </select>
                </div>

                <div class="row no-padding" style="text-align: center; align-items: center;">
                    <div class="col4">Key</div>
                    <div class="col5">Value</div>
                    <div class="col1">Delete</div>
                    <div class="col1">Sel. Similar</div>
                    <div class="col1">Sel. Sibling</div>
                </div>

                <div id="properties" class="row no-padding">
                    ${this.addPropRow(this.configuration.selectedTargets[0])}
                </div>
                

                <div class="row" style="justify-content: center">
                    <a id="add-prop"><i class="tiny material-icons icon-btn">add_circle</i></a>
                </div>

                <a id="configure" class="button">Configure</a>
                <div style="padding-left: 10px; padding-top: 10px; color: red" id="error-msg"></div>
            </form>
        `;
    };


    addPropRow = (target = "", label = "") => {
        return `
        <div class="row no-padding"  style="text-align: center; align-items: center; margin:5px 0px;">
            <div class="col4">
                <input class="js-label-list" type="text" style="width: 84%;">
                <a class="js-edit-key"><i class="tiny material-icons icon-btn">edit_note</i></a>
            </div>
            <div class="col5">
                <input class="js-target-list" type="text"  style="width: 92%;" value="${target}">
                <a class="js-edit-value"><i class="tiny material-icons icon-btn">edit_note</i></a>
            </div>
            <div class="col1">
                <a class="js-delete-prop"><i class="tiny material-icons icon-btn">delete</i></a>
            </div>
            <div class="col1">
                <label class="js-sel-similar">
                    <input type="checkbox"/>
                </label>
            </div>
            <div class="col1">
                <label class="js-sel-siblings">
                    <input type="checkbox"/>
                </label>
            </div>
        </div>
        
        `
    };

    removeMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);
        document.querySelector("#add-prop").addEventListener("click", this.handleAddProp);

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
            document.querySelector("#target-list").value = targetQuerySelector;  // TODO: CHANGE THIS TO NEW SELECTOR
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

    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            stateName: document.querySelector("#state-name").value,
            stateKey: document.querySelector("#state-key").value,
            stateType: document.querySelector("#state-type").value,
            performAfter: document.querySelector("#perform-after").value,
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

    handleAddProp = (e) => {
        const propertyContainer = document.querySelector("#properties");
        propertyContainer.innerHTML += this.addPropRow();
        this.removeMenuListeners();
        this.setMenuListeners();
    };

    setMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // select state targets
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-value`)).forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log("Individual target input clicked");
                this.eventListenerTargets.editValue = e.target;
    
                this.hideMenu();
    
                DynamicEventHandler.addHandler("mouseover", this.stateTargetHandlers.handleMouseOver);
                DynamicEventHandler.addHandler("mouseout", this.stateTargetHandlers.handleMouseOut);
                DynamicEventHandler.addHandler("click", this.stateTargetHandlers.handleSelection);
            });
        });

        // select label targets
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-key`)).forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log("Individual label input clicked");
                this.eventListenerTargets.editKey = e.target;

                this.hideMenu();

                DynamicEventHandler.addHandler("mouseover", this.stateLabelHandlers.handleMouseOver);
                DynamicEventHandler.addHandler("mouseout", this.stateLabelHandlers.handleMouseOut);
                DynamicEventHandler.addHandler("click", this.stateLabelHandlers.handleSelection);
            });
        });

        // select all similar siblings TODO: DO THIS ONLY FOR VALUES, NOT THE KEY
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-similar input`)).forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.eventListenerTargets.selectSimilar = e.target;

                let { finalTargets, selectedTargets, finalLabels, selectedLabels, selectSimilar, selectSiblings } = this.configuration;
                const siblingCheckbox = e.target.parentElement.parentElement.parentElement.querySelector(".js-sel-siblings input");

                if(e.target.checked) {
                    finalTargets = this.populateSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                    // finalLabels = this.populateSimilarTargets(finalLabels, selectedLabels, Enum.elementTypes.STATE_LABEL);
                    selectSimilar = true;
                    selectSiblings = false;
                    siblingCheckbox.checked = false;
                }
                else {
                    finalTargets = this.removeSimilarTargets(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                    // finalLabels = this.removeSimilarTargets(finalLabels, selectedLabels,  Enum.elementTypes.STATE_LABEL);
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
        });

        // select siblings (DOM tree logic)  TODO: DO THIS ONLY FOR VALUES, NOT THE KEY
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-siblings input`)).forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.eventListenerTargets.selectSiblings = e.target;

                const similarCheckbox = e.target.parentElement.parentElement.parentElement.querySelector(".js-sel-similar input");
                let { finalTargets, selectedTargets, finalLabels, selectedLabels, selectSimilar, selectSiblings } = this.configuration;

                if(e.target.checked) {
                    // todo: populate sibling
                    finalTargets = this.populateSiblings(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                    // finalLabels = this.populateSiblings(finalLabels, selectedLabels, Enum.elementTypes.STATE_LABEL);
                    selectSimilar = false;
                    selectSiblings = true;
                    similarCheckbox.checked = false;
                }
                else {
                    finalTargets = this.removeSiblings(finalTargets, selectedTargets, Enum.elementTypes.STATE_TARGET);
                    // finalLabels = this.removeSiblings(finalLabels, selectedLabels,  Enum.elementTypes.STATE_LABEL);
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
        });

        // TODO: ADD LISTNER FOR js-delete-prop
        Array.from(document.querySelectorAll(`#${this.containerId} .js-delete-prop`)).forEach(item => {
            item.addEventListener("click", (e) => {
                // console.log(e.target);
    
                const propertyContainer = document.querySelector("#properties");
                const currRow = e.target.parentElement.parentElement.parentElement;
                propertyContainer.removeChild(currRow);
    
            });
        });

        // TODO: ADD LISTENER TO ADD PROP BUTTON (REMOVE ALL LISTENERS AND ADD AGAIN)
        document.querySelector("#add-prop").addEventListener("click", this.handleAddProp);

        // // clear state targets
        // document.querySelector(`#${this.containerId} #clear-target`).addEventListener("click", (e) => {
        //     this.clearHighlight(this.configuration.finalTargets); // todo: NOT WORKING PROPERLY, COLOR STILL SHOWN
        //     this.configuration.finalTargets = [];
        //     this.configuration.selectedTargets = [];
        //     document.querySelector("#target-list").value = "";
        // });
        
        // // clear label targets
        // document.querySelector("#clear-label").addEventListener("click", (e) => {
        //     this.clearHighlight(this.configuration.finalLabels); // TODO: not working properly
        //     this.configuration.finalLabels = [];
        //     this.configuration.selectedLabels = [];
        //     document.querySelector("#label-list").value = "";
        // });

        // save state config
        document.querySelector("#configure-state > a#configure").addEventListener("click", async e => {
            this.setBasicDetails();
            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                document.querySelector("#error-msg").innerHTML = errorMsg;
                return ;
            }
            const { configType, stateName, stateType, stateKey, selectedTargets, selectedLabels, selectSimilar, selectSiblings, performAfter } = this.configuration;
            await ConfigChain.push({
                configType,
                stateName, 
                stateType,
                stateKey,
                selectedLabels,
                selectedTargets,
                selectSimilar,
                selectSiblings,
                performAfter,
            });
            this.close();
        });
    };

    resetConfiguration = () => {
        this.configuration = {
            configType: Enum.configTypes.STATE,
            stateName: "",
            stateType: null,
            stateKey: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [], 
            finalLabels: [],
            selectSimilar: false,
            selectSiblings: false,    
            // repeatCount: 0,  
            maxTargetCount: -1,
            // index of action to perform after. -1 means collect data immediately
            performAfter: -1,
        }; 
    }

    close = () => {
        this.resetConfiguration();
        this.hideMenu();
        this.removeMenuListeners();  // TODO: Not implemented properly yet
        ConfigManager.disableConfigurationMode();
    };

    populateAssociatedActions = async () => {
        const actions = (await ConfigChain.get()).map((item, index) => [index, item.actionName]);
        const assoActionContainer = document.querySelector("#associated-action");
        assoActionContainer.innerHTML = "";

        if(!actions || !actions.length) {
            assoActionContainer.innerHTML += `<option value="1" disabled>No actions configured yet</option>`;
            return;
        }

        actions.forEach(item => {
            assoActionContainer.innerHTML += `<option value="${item[0]}">A${parseInt(item[0]) + 1} - ${item[1]}</option>`;
        });

    } 

    open = (target) => {     
        ConfigManager.enableConfigurationMode(target, Enum.elementTypes.STATE);

        // initialize configuration values 
        let {selectedTargets, finalTargets} = this.configuration;
        finalTargets.push(target);
        selectedTargets.push(DomUtils.getQuerySelector(target));

        this.populateAssociatedActions();
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();
        this.setMenuListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
    };
}
