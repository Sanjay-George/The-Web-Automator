/* global ConfigManager, Highlighter, DynamicEventHandler, DomUtils */


class ActionMenu extends Menu {
    constructor() {
        super();
        this.containerId = "action-menu";
    }

    initConfiguration = () => {
        this.configuration = {
            configType: Enum.configTypes.ACTION,
            actionName: "",
            actionType: null,
            actionKey: "",
            selectedTargets: [],
            selectedLabels: [],
            finalTargets: [], 
            finalLabels: [],
            selectSimilar: false,
            selectSiblings: false,    
            repeatCount: 0,
            maxTargetCount: -1,
            textInput: [],
            keyPresses: [],   // [{code: "Enter", count: 5, isIncrementalRepeat: false}, ...]
        }; 
    };

    renderMenu = () => {
        return `
            <div class="row">
                <div class="col12">
                    <h4>Configure Action</h4>
                </div>
                <i class="small material-icons profile-close">close</i>
            </div>

            <form id='configure-action' class="row">
                <div class="flex-row col5">
                    <label for="action-name">Action*</label>
                    <input id="action-name" type="text">
                </div>

                <div class="flex-row col4">
                    <label for="action-key">Key</label>
                    <input id="action-key" type="text">
                </div>

                <div class="flex-row col3">
                    <select id="action-type">
                        <option value="" disabled selected>Action Type</option>
                        <option value="${Enum.actionTypes.CLICK}">Click</option>
                        <option value="${Enum.actionTypes.TEXT}" >Text input</option>
                        <option value="${Enum.actionTypes.SELECT}" disabled>Select</option>
                    </select>
                </div>
                
                <div id="text-input-wrapper" class="col12 hide">
                    <label for="text-input">Text Input (comma separated values)</label>
                    <textarea id="text-input" style="width: 100%; margin-top: 5px;"></textarea>
               
                    <div class="col12 flex-row" style="display: flex; align-items: center; flex-wrap: wrap;">
                        <div class="col3">Key</div>
                        <div class="col2">IsActive</div>
                        <div class="col2">Count</div>
                        <div class="col2">Incremental</div>
                    </div>
                    <div id="key-press-wrapper" class="col12">
                        <div class="col12 flex-row" style="display: flex; align-items: center; flex-wrap: wrap;" data-key-code=${Enum.specialKeys.DOWN_ARROW}>
                            <div class="col3"><span>Arrow Down</span></div>
                            <div class="col2">
                                <input class="js-key-status" type="checkbox"/>
                            </div> 
                            <div class="col2">
                                <input class="js-key-count" type="number" min="1" value="1">
                            </div>
                            <div class="col2">
                                <input class="js-key-increment" type="checkbox"/>    
                            </div> 
                        </div>

                        <div class="col12" style="display: flex; align-items: center; flex-wrap: wrap;" data-key-code=${Enum.specialKeys.ENTER}>
                            <div class="col3"><span>Enter</span></div>
                            <div class="col2">
                                <input class="js-key-status" type="checkbox"/>
                            </div> 
                            <div class="col2">
                                <input class="js-key-count" type="number" min="1" value="1">
                            </div>
                            <div class="col2">
                                <input class="js-key-increment" type="checkbox"/>    
                            </div> 
                        </div>
                    </div>
                </div>
            

                <div class="col9">
                    <div class="flex-row">
                        <label for="target-list">Action Target(s)</label>
                        <input id="target-list" type="text" readonly value="${this.configuration.selectedTargets[0]}">
                        <a id="clear-target"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                    <div id="label-target-wrapper" class="flex-row">
                        <label for="label-list">Label Target(s)</label>
                        <input id="label-list" type="text" readonly>
                        <a id="clear-label"><i class="tiny material-icons clear-all">delete</i></a>
                    </div>
                </div>
                <div class="flex-row col3" style="display: flex; align-items: center; flex-wrap: wrap;">
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

                <a id="configure" class="button">Configure</a>
                <div style="padding-left: 10px; padding-top: 10px; color: red" id="error-msg"></div>
            </form>
        `;
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
            
            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const targetQuerySelector = DomUtils.getQuerySelector(e.target);
            // TODO: (DUPLICATE TARGETS CHECK) check if logic works
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

            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const labelQuerySelector = DomUtils.getQuerySelector(e.target);
            if(!this.configuration.finalLabels.includes(e.target)) { 
                this.configuration.selectedLabels.push(labelQuerySelector);
                this.configuration.finalLabels.push(e.target);
            }
            document.querySelector("#label-list").value = labelQuerySelector;
        }
    };

    parseTextInput = csvString => {
        if(csvString.length === 0)  return [];
        return csvString.split(",").filter(item => item.trim().length > 0);
    };

    formulateKeyPresses = () => {
        const keyPressWrapper = document.querySelector("#key-press-wrapper");
        const keys = Array.from(keyPressWrapper.children);
        if(!keys || keys.length ===  0) return [];

        return keys
            .map(key => {
                const isActive = key.children[1].children[0].checked;
                if(!isActive)   return null;
                
                return {
                    keyCode: key.dataset.keyCode,
                    count: parseInt(key.children[2].children[0].value) || 1,
                    isIncrementalRepeat: key.children[3].children[0].checked,
                };
            })
            .filter(key => key !== null);
    };

    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            actionName: document.querySelector("#action-name").value,
            actionKey: document.querySelector("#action-key").value,
            actionType: parseInt(document.querySelector("#action-type").value),
            textInput: this.parseTextInput(document.querySelector("#text-input").value),
            keyPresses: this.formulateKeyPresses() || [],
        };
    };

    validationActionTypeAndInput = () => {
        const { actionType, textInput } = this.configuration;
        if(!actionType) {
            return "Select actionType";
        }
        if(actionType === Enum.actionTypes.TEXT && (!textInput || textInput.length === 0)) {
            return "Enter at least 1 text input";
        }
        return "";
    }

    validateConfig = () => {
        const {actionName, selectedTargets, selectedLabels} = this.configuration;
        let errorMsg = "";
        if(!actionName.length) {
            errorMsg = "Enter actionName";
        }
        else if(!selectedTargets.length) {
            errorMsg = "Select atleast one Action Target";
        }
        else if(selectedLabels.length > 0 && selectedLabels.length !== selectedTargets.length) {
            errorMsg = `${selectedLabels.length} labels are selected, 
                        but ${selectedTargets.length} targets are selected.`;
        }
        const actionTypeErrorMsg = this.validationActionTypeAndInput();
        errorMsg = errorMsg || actionTypeErrorMsg;

        return {
            isValid: errorMsg.length === 0,
            errorMsg  
        };
    };

    menuHandlers = {
        handleSelectActionTargets: e => {
            e.stopPropagation();
            console.log("Individual target input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.actionTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionTargetHandlers.handleSelection);
        },

        handleSelectActionLabels: e => {
            e.stopPropagation();
            console.log("Individual label input clicked");

            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.actionLabelHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.actionLabelHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.actionLabelHandlers.handleSelection);
        },

        handleSelectActionType: e => {
            const textInputWrapper = document.querySelector("#text-input-wrapper");
            const labelWrapper = document.querySelector("#label-target-wrapper");

            if(parseInt(e.target.value) === Enum.actionTypes.TEXT) {
                textInputWrapper.classList.remove("hide");
                labelWrapper.classList.add("hide");
            }
            else {
                !textInputWrapper.classList.contains("hide") && textInputWrapper.classList.add("hide");
                labelWrapper.classList.contains("hide") && labelWrapper.classList.remove("hide");
            }
        },

        handleSelectSimilar: e => {
            e.stopPropagation();
            let 
                { finalTargets, selectedTargets, finalLabels, 
                    selectedLabels, selectSimilar, selectSiblings } = this.configuration;
            const siblingCheckbox = document.querySelector(`#${this.containerId} #sel-siblings input`);
            if(e.target.checked) {
                // INFO: remove existing selected elements first before adding new ones
                finalTargets = 
                    this.removeSimilarElements(
                        this.removeSiblings, finalTargets,
                         selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.removeSimilarElements(
                        this.removeSiblings, finalLabels,
                         selectedLabels,  Enum.elementTypes.ACTION_LABEL);

                finalTargets = 
                    this.populateSimilarElements(
                        this.populateSimilarTargets, finalTargets, 
                        selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.populateSimilarElements(
                        this.populateSimilarTargets, finalLabels, 
                        selectedLabels, Enum.elementTypes.ACTION_LABEL);
                selectSimilar = true;
                selectSiblings = false;
                siblingCheckbox.checked = false;
            }
            else {
                finalTargets = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, finalTargets,
                         selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, finalLabels,
                         selectedLabels,  Enum.elementTypes.ACTION_LABEL);
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
        },

        handleSelectSiblings: e => {
            e.stopPropagation();
            const similarCheckbox = document.querySelector(`#${this.containerId} #sel-similar input`);
            let 
                { finalTargets, selectedTargets, finalLabels, selectedLabels,
                     selectSimilar, selectSiblings } = this.configuration;

            if(e.target.checked) {
                // INFO: remove existing selected elements first before adding new ones
                finalTargets = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, finalTargets,
                         selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, finalLabels,
                         selectedLabels,  Enum.elementTypes.ACTION_LABEL);

                finalTargets = 
                    this.populateSimilarElements(
                        this.populateSiblings, finalTargets, 
                        selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.populateSimilarElements(
                        this.populateSiblings, finalLabels, 
                        selectedLabels, Enum.elementTypes.ACTION_LABEL);
                selectSimilar = false;
                selectSiblings = true;
                similarCheckbox.checked = false;
            }
            else {
                finalTargets = 
                    this.removeSimilarElements(
                        this.removeSiblings, finalTargets,
                         selectedTargets, Enum.elementTypes.ACTION_TARGET);
                finalLabels = 
                    this.removeSimilarElements(
                        this.removeSiblings, finalLabels,
                         selectedLabels,  Enum.elementTypes.ACTION_LABEL);
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
        },

        handleClearActionTargets: e => {
            this.clearHighlight(this.configuration.finalTargets); // todo: NOT WORKING PROPERLY, COLOR STILL SHOWN
            this.configuration.finalTargets = [];
            this.configuration.selectedTargets = [];
            document.querySelector("#target-list").value = "";
        },

        handleClearActionLabels: e => {
            this.clearHighlight(this.configuration.finalLabels); // TODO: not working properly
            this.configuration.finalLabels = [];
            this.configuration.selectedLabels = [];
            document.querySelector("#label-list").value = "";
        },

        handleSaveConfig: async e => {
            this.setBasicDetails();
            
            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                document.querySelector("#error-msg").innerHTML = errorMsg;
                return ;
            }

            const 
                { configType, actionName, actionType, 
                    actionKey, selectedTargets, selectedLabels, selectSimilar,
                     selectSiblings, finalLabels, finalTargets, textInput, keyPresses } = this.configuration;

            for (let i = 0; i < selectedTargets.length; i++) {
                selectedTargets[i] = 
                    DomUtils.QuerySelectors.convertAllTagsInPathToAnotherType(
                        selectedTargets[i], 
                        DomUtils.QuerySelectors.convertToAnchor
                    );

                if(!DomUtils.isValidQuerySelector(selectedLabels[i])) {
                    continue;
                }
                selectedLabels[i] = 
                    DomUtils.QuerySelectors.convertAllTagsInPathToAnotherType(
                        selectedLabels[i], 
                        DomUtils.QuerySelectors.convertToAnchor
                    );
            }


            await ConfigChain.push({
                configType,
                actionName, 
                actionType,
                actionKey,
                selectedLabels,
                selectedTargets,
                selectSimilar,
                selectSiblings,
                textInput,
                keyPresses,
            });
            this.close();
        },


    };

    setMenuListeners = () => {
        // close btn
        document
            .querySelector(`#${this.containerId} .profile-close`)
            .addEventListener("click", this.close);

        // select action targets
        document
            .querySelector(`#${this.containerId} #target-list`)
            .addEventListener("click", this.menuHandlers.handleSelectActionTargets);

        // select label targets
        document
            .querySelector(`#${this.containerId} #label-list`)
            .addEventListener("click", this.menuHandlers.handleSelectActionLabels);
        
        // select action type
        document
            .querySelector(`#${this.containerId} #action-type`)
            .addEventListener("change", this.menuHandlers.handleSelectActionType);

        // select all similar siblings
        document
            .querySelector(`#${this.containerId} #sel-similar`)
            .addEventListener("click", this.menuHandlers.handleSelectSimilar);

        // select siblings (DOM tree logic)
        document
            .querySelector(`#${this.containerId} #sel-siblings`)
            .addEventListener("click", this.menuHandlers.handleSelectSiblings);

        // clear action targets
        document
            .querySelector(`#${this.containerId} #clear-target`)
            .addEventListener("click", this.menuHandlers.handleClearActionTargets);
        
        // clear label targets
        document
            .querySelector("#clear-label")
            .addEventListener("click", this.menuHandlers.handleClearActionLabels);

        // save action config
        document
            .querySelector("#configure-action > a#configure")
            .addEventListener("click", this.menuHandlers.handleSaveConfig);
    };

    removeMenuListeners = () => {
        // close btn
        document
            .querySelector(`#${this.containerId} .profile-close`)
            .removeEventListener("click", this.close);
    };

    close = () => {
        this.initConfiguration();
        this.hideMenu();
        this.removeMenuListeners(); 

        ConfigManager.enableAllAnchorTags();
        ConfigManager.disableConfigurationMode();
    };

    open = (target) => {     
        ConfigManager.enableConfigurationMode(target, Enum.elementTypes.ACTION);

        let {selectedTargets, finalTargets} = this.configuration;
        
        const sanitizedtarget = 
            DomUtils.DomElements.convertAllTagsInPathToAnotherType(target, DomUtils.DomElements.convertToNoLink);
        const sanitizedTargetSelector = DomUtils.getQuerySelector(sanitizedtarget);
        selectedTargets.push(sanitizedTargetSelector);
        finalTargets.push(sanitizedtarget);

        // INFO: Need to do this separately to handle <no-link> tags which aren't formed 
        //      until convertAllTagsInPath..() is called.
        Highlighter.highlightElement(sanitizedtarget, Enum.elementTypes.ACTION);
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();

        ConfigManager.disableAllAnchorTags();
        this.setMenuListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
        this.initConfiguration();
    };
}
