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
            performAfter: -1,   
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
                        <option value="-1" disabled selected>Select when to perform state*</option>
                        <option value="0">Perform immediately</option>
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
            <div class="col4">
                <input class="js-label-list" type="text" style="width: 84%;" value="${label}">
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
        `

        row.innerHTML = innerHTML;
        return row;
    };

    removeMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).removeEventListener("click", this.close);
        document.querySelector("#add-prop").addEventListener("click", this.handleAddProp);

    };


    stateTargetHandlers = {
        handleMouseOver: e => {
            Highlighter.highlightElement(e.target, Enum.elementTypes.STATE_TARGET);
        },
    
        handleMouseOut: e => {
            Highlighter.resetHighlight(e.target);
        },
    
        handleSelection: e => {
            // TODO: HOW TO PREVENT REACT ROUTER?
            e.preventDefault();
            this.showMenu();
            
            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const targetQuerySelector = DomUtils.getQuerySelector(e.target);

            const { properties, propertiesMeta } = this.configuration;
            
            // TODO: CHECK FOR DUPLICATE TARGETS

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1; 
            properties[propIndex].value = targetQuerySelector;
            propertiesMeta[propIndex].value = [ e.target ];
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
            // TODO: HOW TO PREVENT routing?
            // event listener is on document, hence routing already in progress by the time handler is hit
            e.preventDefault();
            this.showMenu();

            DynamicEventHandler.removeHandler("mouseover");
            DynamicEventHandler.removeHandler("mouseout");
            DynamicEventHandler.removeHandler("click");

            const targetQuerySelector = DomUtils.getQuerySelector(e.target);

            const { properties, propertiesMeta } = this.configuration;

            const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10); 
            properties[propIndex - 1].key = targetQuerySelector;
            propertiesMeta[propIndex - 1].key = e.target;
            this.currentPropTarget.querySelector('.js-label-list').value = targetQuerySelector;
            
            // document.querySelector("#label-list").value = labelQuerySelector;
        }
    };

    setBasicDetails = () => {
        this.configuration = {
            ...this.configuration,
            stateName: document.querySelector("#state-name").value,
            collectionKey: document.querySelector("#state-key").value,
            stateType: document.querySelector("#state-type").value,
            performAfter: parseInt(document.querySelector("#perform-after").value, 10),
        };
    };

    validateConfig = () => {
        const {stateName, collectionKey, stateType, performAfter, properties} = this.configuration;
        let errorMsg = "";
        if(!stateName.length || !collectionKey.length) {
            errorMsg = "Enter stateName and collectionKey";
        }
        else if(!stateType) {
            errorMsg = "Select stateType";
        }
        else if(performAfter < 0) {
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

    handleAddProp = e => {
        const { properties, propertiesMeta } = this.configuration;
        properties.push(new StateProperty({ value: DomUtils.getQuerySelector(e.target)}));
        propertiesMeta.push(new StateProperty({ value: [ e.target ] }));

        const propertyContainer = document.querySelector("#properties");
        propertyContainer.append(this.addPropRow()); 
        this.removeMenuListeners();
        this.setMenuListeners();
    };

    setMenuListeners = () => {
        // close btn
        document.querySelector(`#${this.containerId} .profile-close`).addEventListener("click", this.close);

        // edit property value
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-value`)).forEach(item => {
            item.addEventListener("click", e => {
                e.stopPropagation();
                this.currentPropTarget = e.target.closest('.js-property');
    
                const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1;
                Highlighter.resetHighlight(this.configuration.propertiesMeta[propIndex].value[0]); 
                this.hideMenu();
    
                DynamicEventHandler.addHandler("mouseover", this.stateTargetHandlers.handleMouseOver);
                DynamicEventHandler.addHandler("mouseout", this.stateTargetHandlers.handleMouseOut);
                DynamicEventHandler.addHandler("click", this.stateTargetHandlers.handleSelection);
            });
        });

        // edit property key
        Array.from(document.querySelectorAll(`#${this.containerId} .js-edit-key`)).forEach(item => {
            item.addEventListener("click", e => {
                e.stopPropagation();
                this.currentPropTarget = e.target.closest('.js-property');

                const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1;
                Highlighter.resetHighlight(this.configuration.propertiesMeta[propIndex].key);
                this.hideMenu();

                DynamicEventHandler.addHandler("mouseover", this.stateLabelHandlers.handleMouseOver);
                DynamicEventHandler.addHandler("mouseout", this.stateLabelHandlers.handleMouseOut);
                DynamicEventHandler.addHandler("click", this.stateLabelHandlers.handleSelection);
            });
        });

        // select all similar siblings
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-similar input`)).forEach(item => {
            item.addEventListener("click", e => {
                e.stopPropagation();
                let { properties, propertiesMeta } = this.configuration;

                this.currentPropTarget = e.target.closest('.js-property');
                const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1; 
                const siblingCheckbox = this.currentPropTarget.querySelector(".js-sel-siblings input");

                if(e.target.checked) {
                    propertiesMeta[propIndex].value = this.populateSimilarTargets(propertiesMeta[propIndex].value, [properties[propIndex].value], Enum.elementTypes.STATE_TARGET);
                    propertiesMeta[propIndex].key = this.populateSimilarTargets(propertiesMeta[propIndex].key, [properties[propIndex].key], Enum.elementTypes.STATE_LABEL);
                    properties[propIndex].selectSimilar = true;
                    properties[propIndex].selectSiblings = false;
                    siblingCheckbox.checked = false;
                }
                else {
                    propertiesMeta[propIndex].value = this.removeSimilarTargets(propertiesMeta[propIndex].value, [properties[propIndex].value], Enum.elementTypes.STATE_TARGET);
                    propertiesMeta[propIndex].key = this.removeSimilarTargets(propertiesMeta[propIndex].key, [properties[propIndex].key], Enum.elementTypes.STATE_LABEL);
                    properties[propIndex].selectSimilar = false;
                }
                this.configuration = {
                    ...this.configuration,
                    properties,
                    propertiesMeta,
                };
            });
        });

        // select siblings (DOM tree logic) 
        Array.from(document.querySelectorAll(`#${this.containerId} .js-sel-siblings input`)).forEach(item => {
            item.addEventListener("click", e => {
                e.stopPropagation();

                let { selectSimilar, selectSiblings } = this.configuration;
                let { properties, propertiesMeta } = this.configuration;

                this.currentPropTarget = e.target.closest('.js-property');
                const propIndex = parseInt(this.currentPropTarget.dataset.propId, 10) - 1; 
                const similarCheckbox = this.currentPropTarget.querySelector(".js-sel-similar input");

                if(e.target.checked) {
                    propertiesMeta[propIndex].value = this.populateSiblings(propertiesMeta[propIndex].value, [properties[propIndex].value], Enum.elementTypes.STATE_TARGET);
                    propertiesMeta[propIndex].key = this.populateSiblings(propertiesMeta[propIndex].key, [properties[propIndex].key], Enum.elementTypes.STATE_LABEL);
                    properties[propIndex].selectSimilar = false;
                    properties[propIndex].selectSiblings = true;
                    similarCheckbox.checked = false;
                }
                else {
                    propertiesMeta[propIndex].value = this.removeSiblings(propertiesMeta[propIndex].value, [properties[propIndex].value], Enum.elementTypes.STATE_TARGET);
                    propertiesMeta[propIndex].key = this.removeSiblings(propertiesMeta[propIndex].key, [properties[propIndex].key], Enum.elementTypes.STATE_LABEL);
                    properties[propIndex].selectSiblings = false;
                }

                this.configuration = {
                    ...this.configuration,
                    properties,
                    propertiesMeta,
                };
            });
        });

        // TODO: ADD LISTNER FOR js-delete-prop
        Array.from(document.querySelectorAll(`#${this.containerId} .js-delete-prop`)).forEach(item => {
            item.addEventListener("click", e => {
                const propertyContainer = document.querySelector("#properties");
                const currRow = e.target.closest('.js-property');
                propertyContainer.removeChild(currRow);
            });
        });

        // TODO: ADD LISTENER TO ADD PROP BUTTON (REMOVE ALL LISTENERS AND ADD AGAIN)
        document.querySelector("#add-prop").addEventListener("click", this.handleAddProp);


        // save state config
        document.querySelector("#configure-state > a#configure").addEventListener("click", async e => {
            this.setBasicDetails();
            const {isValid, errorMsg} = this.validateConfig();
            if(!isValid) {
                document.querySelector("#error-msg").innerHTML = errorMsg;
                return ;
            }

            const { configType, stateName, stateType, collectionKey, properties, performAfter } = this.configuration;
            const index = performAfter > 0 ? performAfter + 1 : performAfter;
            const item = {
                configType,
                stateName, 
                stateType,
                collectionKey,
                properties,
                performAfter,
            }
            await ConfigChain.insertAt(item, index);
            this.close();
        });
    };

    close = () => {
        this.initConfiguration();
        this.hideMenu();
        this.removeMenuListeners();  // TODO: Not implemented properly yet
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
            assoActionContainer.innerHTML += `<option value="-1" disabled>No actions configured yet</option>`;
            return;
        }

        actions.forEach((item, index) => {
            assoActionContainer.innerHTML += `<option value="${item.index}">A${parseInt(index, 10) + 1} - ${item.name}</option>`;
        });

    } 

    open = (target) => {     
        ConfigManager.enableConfigurationMode(target, Enum.elementTypes.STATE);

        // initialize configuration values 
        const { properties, propertiesMeta } = this.configuration;
        properties.push(new StateProperty({ value: DomUtils.getQuerySelector(target) }));
        propertiesMeta.push(new StateProperty({ value: [ target ]}));

        this.populateAssociatedActions();
        
        this.menu.innerHTML = this.renderMenu();
        this.showMenu();
        
        // add prop row to menu 
        const propertyContainer = document.querySelector(`#${this.containerId} #properties`);
        propertyContainer.append(this.addPropRow(DomUtils.getQuerySelector(target))); 
        
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

