/*
TODO: 
1. Issue - Coloring issue with property key & value (once a property is selected, try with another one. Somewhere listener is failing)
4. Handle colors when property is deleted
5. Add provision for setting key as selector - if key is text, don't colorize / search for similar elements
6. Improve similar search logic, especially for property keys. [sort of handled in automator] 
*/

class StateMenu extends Menu {
    constructor() {
        super();
        this.containerId = "state-menu";
    }

    initConfiguration = () => {
        this.configuration = {
            configType: Enum.configTypes.STATE,
            stateName: "",
            stateType: null,
            collectionKey: "",
            properties: [],  // [{key: 'selector/text', value: 'selector', selectSimilar: bool, selectSiblings: bool}, {}, ...]
            propertiesMeta: [],  // [{ key: 'element/text', value: ['element1', 'element2', ...] }, {}, ...]
            repeatCount: 0,  
            maxTargetCount: -1,
            // index of action (in config chain) to perform/collect state after
            configChainIndex: -1,   
        }; 

        this.currentPropTarget = null;
    };

    renderMenu = () => {
        return `
            <div class="row">
                <div class="col12">
                    <h4>Configure State</h4>
                </div>
                <i class="small material-icons profile-close">close</i>
            </div>

            <form id='configure-state' class="row">
                <div class="flex-row col6">
                    <label for="state-name">Name*</label>
                    <input id="state-name" type="text">
                </div>

                <div class="flex-row col4">
                    <select id="state-type">
                        <option value="" disabled selected>State Type</option>
                        <option value="1">Scrape Data</option>
                        <option value="2" disabled>Monitor Data</option>
                        <option value="3" disabled>Store console logs</option>
                    </select>
                </div>

                <div class="flex-row col8">
                    <label for="state-key">Collection Key*</label>
                    <input id="state-key" type="text">
                </div>

                <div class="flex-row col4">
                    <select id="perform-after">
                        <option value="" disabled selected>Select when to perform state*</option>
                        <option value="-1">Perform immediately</option>
                        <optgroup label="Perform after action" id="associated-action">
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
        const row = document.createElement("div");
        const id = this.configuration.properties.length || 0;
        row.dataset.propId = id;
        row.classList.add('row', 'no-padding', 'js-property');
        row.style="text-align: center; align-items: center; margin:5px 0px;";
        label = label || `key${id}`;

        const innerHTML = `
            <div class="col4 flex-nowrap">
                <input class="js-label-list" type="text" style="width: 84%;" value="${label}">
                <a class="js-edit-key"><i class="tiny material-icons icon-btn">edit_note</i></a>
            </div>
            <div class="col5 flex-nowrap">
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
        `

        row.innerHTML = innerHTML;
        return row;
    };

    stateTargetHandlers = {
        handleMouseOver: e => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.STATE_TARGET);
        },
    
        handleMouseOut: e => {
            Highlighter.resetHighlight(e.target);
        },
    
        handleSelection: e => {
            e.preventDefault();
            this.showMenu();
            
            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const target = e.target;
            const targetQuerySelector = DomUtils.getQuerySelector(target);

            const { properties, propertiesMeta } = this.configuration;
            
            // TODO: CHECK FOR DUPLICATE TARGETS

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1; 
            properties[propIndex].value = targetQuerySelector;
            propertiesMeta[propIndex].value = [ target ];
            this.currentPropTarget.querySelector('.js-target-list').value = targetQuerySelector;
        }
    };

    stateLabelHandlers = {
        handleMouseOver: e => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.STATE_LABEL);
        },
        handleMouseOut: e => {
            Highlighter.resetHighlight(e.target);
        },
        handleSelection: e => {
            e.preventDefault();
            this.showMenu();

            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const target = e.target;
            const targetQuerySelector = DomUtils.getQuerySelector(e.target);

            const { properties, propertiesMeta } = this.configuration;

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1; 
            properties[propIndex].key = targetQuerySelector;
            propertiesMeta[propIndex].key = target;
            this.currentPropTarget.querySelector('.js-label-list').value = targetQuerySelector;
            
        }
    };

    setBasicDetails = () => {
        const performAfter =  parseInt(document.querySelector("#perform-after").value, 10);
        this.configuration = {
            ...this.configuration,
            stateName: document.querySelector("#state-name").value,
            collectionKey: document.querySelector("#state-key").value,
            stateType: document.querySelector("#state-type").value,
            configChainIndex: isNaN(performAfter) ? null : performAfter + 1,
        };
    };

    setPropertyKeysAndValues = () => {
        const propertyKeys 
            = Array.from(document.querySelectorAll(`#${this.containerId} .js-label-list`));
        const propertyValues 
            = Array.from(document.querySelectorAll(`#${this.containerId} .js-target-list`));

        const { properties } = this.configuration;

        propertyKeys.forEach((element, index) => {
            properties[index].key =  element.value;
        });

        propertyValues.forEach((element, index) => {
            properties[index].value =  element.value;
        });
    };


    validateConfig = () => {
        const {stateName, collectionKey, stateType, configChainIndex, properties} = this.configuration;
        let errorMsg = "";
        if(!stateName.length || !collectionKey.length) {
            errorMsg = "Enter stateName and collectionKey";
        }
        else if(!stateType) {
            errorMsg = "Select stateType";
        }
        else if(configChainIndex < 0) {
            errorMsg = "Select when to collect the state";
        }
        else if(!properties.length) {
            errorMsg = "Configure at least one property";
        }

        return {
            isValid: errorMsg.length === 0,
            errorMsg  
        };
    };

    showError = error => {
        document.querySelector("#error-msg").innerHTML = error;
    };

    menuHandlers = {
        handlePropertyKeyEdit: e => {
            e.stopPropagation();
            this.currentPropTarget = e.target.closest('.js-property');

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1;
            Highlighter.resetHighlight(this.configuration.propertiesMeta[propIndex].key);
            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.stateLabelHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.stateLabelHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.stateLabelHandlers.handleSelection);
        },

        handlePropertyValueEdit: e => {
            e.stopPropagation();
            this.currentPropTarget = e.target.closest('.js-property');

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1;
            Highlighter.resetHighlight(this.configuration.propertiesMeta[propIndex].value[0]); // NOTE: Assuming there'll be only one element as value per property (this could change in future)
            this.hideMenu();

            DynamicEventHandler.addHandler("mouseover", this.stateTargetHandlers.handleMouseOver);
            DynamicEventHandler.addHandler("mouseout", this.stateTargetHandlers.handleMouseOut);
            DynamicEventHandler.addHandler("click", this.stateTargetHandlers.handleSelection);
        },

        handleAddProp: e => {
            const { properties, propertiesMeta } = this.configuration;
            properties.push(new StateProperty({ value: ""}));
            propertiesMeta.push(new StateProperty({ value: [ ] }));

            const propertyContainer = document.querySelector("#properties");
            propertyContainer.append(this.addPropRow());
            this.removeMenuListeners();
            this.setMenuListeners();
        }, 
        
        handleDeleteProp: e => {
            const propertyContainer = document.querySelector("#properties");
            const currRow = e.target.closest('.js-property');
            propertyContainer.removeChild(currRow);

            // TODO: REMOVE FROM PROPERTIES & PROPERTIESMETA ARRAY 
            const { properties, propertiesMeta } = this.configuration;
            const propIndex = parseInt(currRow.dataset.propId, 10) - 1;
            properties.splice(propIndex, 1);
            propertiesMeta.splice(propIndex, 1);
        },

        handleSelectSimilar: e => {
            e.stopPropagation();
            let { properties, propertiesMeta } = this.configuration;

            const currRow = e.target.closest('.js-property');
            const propIndex = parseInt(currRow.dataset.propId, 10) - 1; 
            const siblingCheckbox = currRow.querySelector(".js-sel-siblings input");

            if(e.target.checked) {
                // INFO: remove existing selected elements first before adding new ones
                propertiesMeta[propIndex].value = 
                    this.removeSimilarElements(
                        this.removeSiblings, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.removeSimilarElements(
                        this.removeSiblings, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                propertiesMeta[propIndex].value = 
                    this.populateSimilarElements(
                        this.populateSimilarTargets, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.populateSimilarElements(
                        this.populateSimilarTargets, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                properties[propIndex].selectSimilar = true;
                properties[propIndex].selectSiblings = false;
                siblingCheckbox.checked = false;
            }
            else {
                propertiesMeta[propIndex].value = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                properties[propIndex].selectSimilar = false;
            }
            this.configuration = {
                ...this.configuration,
                properties,
                propertiesMeta,
            };
        },

        handleSelectSiblings: e => {
            e.stopPropagation();

            let { properties, propertiesMeta } = this.configuration;

            const currRow = e.target.closest('.js-property');
            const propIndex = parseInt(currRow.dataset.propId, 10) - 1; 
            const similarCheckbox = currRow.querySelector(".js-sel-similar input");

            if(e.target.checked) {
                // INFO: remove existing selected elements first before adding new ones
                propertiesMeta[propIndex].value = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.removeSimilarElements(
                        this.removeSimilarTargets, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                propertiesMeta[propIndex].value = 
                    this.populateSimilarElements(
                        this.populateSiblings, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.populateSimilarElements(
                        this.populateSiblings, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                properties[propIndex].selectSimilar = false;
                properties[propIndex].selectSiblings = true;
                similarCheckbox.checked = false;
            }
            else {
                propertiesMeta[propIndex].value = 
                    this.removeSimilarElements(
                        this.removeSiblings, 
                        propertiesMeta[propIndex].value, 
                        [properties[propIndex].value], 
                        Enum.elementTypes.STATE_TARGET
                    );
                propertiesMeta[propIndex].key = 
                    this.removeSimilarElements(
                        this.removeSiblings, 
                        propertiesMeta[propIndex].key, 
                        [properties[propIndex].key], 
                        Enum.elementTypes.STATE_LABEL
                    );
                properties[propIndex].selectSiblings = false;
            }

            this.configuration = {
                ...this.configuration,
                properties,
                propertiesMeta,
            };
        },

        handleSaveConfig: async e => {
            this.setBasicDetails();
            this.setPropertyKeysAndValues();

            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                this.showError(errorMsg);
                return ;
            }

            const 
                { configType, stateName, stateType, collectionKey, 
                    properties, propertiesMeta, configChainIndex } = this.configuration;
            
            for(let i = 0; i < properties.length; i++) {
                const prop = properties[i];

                if(!DomUtils.isValidQuerySelector(prop.value)) { 
                    console.warn("State collection values have to be DOM elements.");
                    this.showError("State collection values have to be DOM elements.");
                    break;
                }

                prop.value = DomUtils.QuerySelectors.convertAllTagsInPathToAnotherType(prop.value, DomUtils.QuerySelectors.convertToAnchor);

                if(!DomUtils.isValidQuerySelector(prop.key)) {
                    continue;
                }

                prop.key = DomUtils.QuerySelectors.convertAllTagsInPathToAnotherType(prop.key, DomUtils.QuerySelectors.convertToAnchor);
            }

            const item = {
                configType,
                stateName, 
                stateType,
                collectionKey,
                properties,
            }
            await ConfigChain.insertAt(item, configChainIndex);
            this.close();
        },
    };

    removeMenuListeners = () => {
        document
            .querySelector(`#${this.containerId} .profile-close`)
            .removeEventListener("click", this.close);

        // close btn
        document
            .querySelector(`#${this.containerId} .profile-close`)
            .removeEventListener("click", this.close);

        // edit property value
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-value`)).forEach(item => {
            item.removeEventListener("click", this.menuHandlers.handlePropertyValueEdit);
        });

        // edit property key
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-key`)).forEach(item => {
            item.removeEventListener("click", this.menuHandlers.handlePropertyKeyEdit);
        });

        // select all similar siblings
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-similar input`)).forEach(item => {
            item.removeEventListener("click", this.menuHandlers.handleSelectSimilar);
        });

        // select siblings (DOM tree logic) 
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-siblings input`)).forEach(item => {
            item.removeEventListener("click", this.menuHandlers.handleSelectSiblings);
        });

        // delete property
        Array.from(document.querySelectorAll(`#${this.containerId} .js-delete-prop`)).forEach(item => {
            item.removeEventListener("click", this.menuHandlers.handleDeleteProp);
        });

        // add property
        document
            .querySelector("#add-prop")
            .removeEventListener("click", this.menuHandlers.handleAddProp);

        // save state config
        document
            .querySelector("#configure-state > a#configure")
            .removeEventListener("click", this.menuHandlers.handleSaveConfig);
    };

    setMenuListeners = () => {
        // close btn
        document
            .querySelector(`#${this.containerId} .profile-close`)
            .addEventListener("click", this.close);

        // edit property value
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-value`)).forEach(item => {
            item.addEventListener("click", this.menuHandlers.handlePropertyValueEdit);
        });

        // edit property key
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-key`)).forEach(item => {
            item.addEventListener("click", this.menuHandlers.handlePropertyKeyEdit);
        });

        // select all similar siblings
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-similar input`)).forEach(item => {
            item.addEventListener("click", this.menuHandlers.handleSelectSimilar);
        });

        // select siblings (DOM tree logic) 
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-siblings input`)).forEach(item => {
            item.addEventListener("click", this.menuHandlers.handleSelectSiblings);
        });

        // delete property
        Array.from(document.querySelectorAll(`#${this.containerId} .js-delete-prop`)).forEach(item => {
            item.addEventListener("click", this.menuHandlers.handleDeleteProp);
        });

        // add property
        document
            .querySelector("#add-prop")
            .addEventListener("click", this.menuHandlers.handleAddProp);

        // save state config
        document
            .querySelector("#configure-state > a#configure")
            .addEventListener("click", this.menuHandlers.handleSaveConfig);
    };    

    close = () => {
        this.initConfiguration();
        this.hideMenu();
        this.removeMenuListeners();
        ConfigManager.enableAllAnchorTags();
        ConfigManager.disableConfigurationMode();
    };

    populateAssociatedActions = async () => {
        const configChain = (await ConfigChain.get());
        const actions = [];
        
        const assoActionContainer = document.querySelector("#associated-action");
        assoActionContainer.innerHTML = "";
        
        configChain.forEach((item, index) => {
            if(item.configType === Enum.configTypes.ACTION) {
                actions.push({
                    index: index, 
                    name: item.actionName
                });
            }
        });

        if(!actions.length) {
            assoActionContainer.innerHTML += 
                `<option value="" disabled>No actions configured yet</option>`;
            return;
        }

        actions.forEach((item, index) => {
            assoActionContainer.innerHTML += 
                `<option value="${item.index}">A${parseInt(index, 10) + 1} - ${item.name}</option>`;
        });

    } 

    open = (target) => {     
        ConfigManager.enableConfigurationMode(target, Enum.elementTypes.STATE);

        const { properties, propertiesMeta } = this.configuration;
        const sanitizedtarget = 
            DomUtils.DomElements.convertAllTagsInPathToAnotherType(target, DomUtils.DomElements.convertToNoLink);
        const sanitizedTargetSelector = DomUtils.getQuerySelector(sanitizedtarget);
        properties.push(new StateProperty({ value:  sanitizedTargetSelector }));
        propertiesMeta.push(new StateProperty({ value: [ sanitizedtarget ]}));

        // INFO: Need to do this separately to handle <no-link> tags which aren't formed 
        //      until convertAllTagsInPath..() is called.
        Highlighter.highlightElement(sanitizedtarget, Enum.elementTypes.STATE);

        ConfigManager.disableAllAnchorTags();
        this.populateAssociatedActions();
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();
        
        // add prop row to menu 
        const propertyContainer = document.querySelector(`#${this.containerId} #properties`);
        propertyContainer.append(this.addPropRow(sanitizedTargetSelector)); 
        
        this.setMenuListeners();
    };

    initialize = () => {
        this.createMenuElement(this.containerId);
        this.createOverlay();
        this.initConfiguration();
    };
}


class StateProperty
{
    constructor({key, value, selectSimilar = false, selectSiblings = false}){
        this.key = key || "";
        this.value = value;
        this.selectSimilar = selectSimilar;
        this.selectSiblings = selectSiblings;
    }
}

