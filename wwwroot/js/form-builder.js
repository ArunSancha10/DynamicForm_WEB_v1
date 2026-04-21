/* =====================================================
   FORM BUILDER STATE
===================================================== */

let selectedNodeId = null;
const formStore = {};
let currentOptionType = null;

/* =====================================================
   ELEMENT LIBRARY (RIGHT PANEL)
===================================================== */

const ELEMENT_LIBRARY = [
    { type: "input", label: "Input", icon: "🔤" },
    { type: "textarea", label: "Textarea", icon: "📝" },
    { type: "checkbox", label: "Checkbox", icon: "☑️" },
    { type: "radio", label: "Radio", icon: "🔘" },
    { type: "button", label: "Button", icon: "🔘" }
];

window.onload = () => renderControls();

/* =====================================================
   FORM LOAD
===================================================== */

function loadForm(node) {
    debugger;
    selectedNodeId = node.id;
    builderTitle.textContent = node.name;

    // clear canvas
    formCanvas.innerHTML = "";

    // ===== MAIN LAYOUT =====
    const layout = document.createElement("div");
    layout.className = "canvas-layout";

    /* ================= LEFT : SELECTED ACTIONS ================= */

    const left = document.createElement("div");
    left.className = "canvas-left";

    left.innerHTML = `
        <div class="card">
            <div class="card-header fw-bold">
                Selected Actions
            </div>

            <div id="selectedActions" class="card-body">
                <div class="text-muted small">
                    Selected Custom Creation show here
                </div>
            </div>
        </div>

        <button class="btn btn-dark mt-3 w-100"
                onclick="saveSelectedActions()">
            Save
        </button>
    `;

    /* ================= RIGHT : DESIGN AREA ================= */

    const right = document.createElement("div");
    right.className = "canvas-right d-none";
    right.id = "designPanel";

    right.innerHTML = `
        <div class="design-header">
            <span class="fw-bold">+ ADD</span>
            <span class="design-close"
                  onclick="closeDesignPanel()">✖</span>
        </div>

        <div class="design-body">
            <div class="design-placeholder">
                Here Drag and use the Custom<br/>
                Creation for create popup
            </div>
        </div>

        <div class="design-footer">
            <button class="btn btn-dark"
                    onclick="savePopupDesign()">
                Save
            </button>
        </div>
    `;

    /* ================= APPEND ================= */

    layout.append(left, right);
    formCanvas.appendChild(layout);

    /* ================= LOAD SAVED DATA (OPTIONAL) ================= */

    loadSelectedActionsForNode(node.id);
}

function loadSelectedActionsForNode(nodeId) {
    const container = document.getElementById("selectedActions");
    if (!container) return;

    container.innerHTML = "";

    const saved = selectedCustomActionsByNode?.[nodeId];

    if (!saved || !saved.length) {
        container.innerHTML = `
            <div class="text-muted small">
                Selected Custom Creation show here
            </div>`;
        return;
    }

    saved.forEach(type => {
        const div = document.createElement("div");
        div.className = "selected-item";
        div.innerText = type.toUpperCase();
        div.onclick = () => openDesignPanel(type);
        container.appendChild(div);
    });
}


/* =====================================================
   DEFAULT ACTIONS
===================================================== */

function defaultActionsHtml() {
    return `
    <div class="card h-100">
        <div class="card-header fw-bold">Default Actions</div>
        <div class="card-body d-flex flex-column gap-3">

            <div class="default-item" data-enabled="true">
                <select class="form-select form-select-sm">
                    <option disabled selected>Export</option>
                    <option>PDF</option>
                    <option>Excel</option>
                </select>
            </div>

            <button class="btn btn-sm btn-primary">+ Add</button>

        </div>
    </div>`;
}

/* =====================================================
   CONTROLS (RIGHT PANEL)
===================================================== */

function renderControls() {
    const container = document.querySelector(".controls");
    container.innerHTML = `<h6 class="mb-3">Custom Creation</h6>`;

    ELEMENT_LIBRARY.forEach(el => {
        const btn = document.createElement("div");
        btn.className = "control-item";
        btn.innerHTML = `${el.icon} ${el.label}`;
        btn.onclick = () => handleAddElement(el.type);
        container.appendChild(btn);
    });
}

function handleAddElement(type) {
    if (!selectedNodeId) {
        alert("Select heading first");
        return;
    }

    addToSelectedActions(type);
    openDesignPanel();
}

function saveSelectedActions() {
    console.log("Selected actions:", selectedCustomActions);
}

function savePopupDesign() {
    alert("Popup design saved");
}


function addToSelectedActions(type) {
    if (selectedCustomActions.includes(type)) return;

    selectedCustomActions.push(type);

    const container = document.getElementById("selectedActions");
    container.innerHTML = "";

    selectedCustomActions.forEach(t => {
        const div = document.createElement("div");
        div.className = "selected-item";
        div.innerText = t.toUpperCase();
        div.onclick = () => openDesignPanel(t);
        container.appendChild(div);
    });
}


/* =====================================================
   BASIC FIELDS
===================================================== */

function addField(type) {
    const field = { type, label: type.toUpperCase() };
    formStore[selectedNodeId] ??= [];
    formStore[selectedNodeId].push(field);

    renderFieldFromStore(field,
        document.querySelector(".form-fields-wrapper"));
}

function renderFieldFromStore(field, container) {
    const div = document.createElement("div");
    div.className = "form-field";

    div.innerHTML = `
        <button class="delete-field">🗑️</button>
        <label>${field.label}</label>
        ${renderSimpleField(field.type)}
    `;

    div.querySelector(".delete-field").onclick = () => {
        div.remove();
        formStore[selectedNodeId] =
            formStore[selectedNodeId].filter(f => f !== field);
    };

    container.appendChild(div);
}

function renderSimpleField(type) {
    if (type === "textarea") return `<textarea class="form-control"></textarea>`;
    if (type === "button") return `<button class="btn btn-primary mt-2">Button</button>`;
    return `<input class="form-control" />`;
}

/* =====================================================
   OPTION BUILDER
===================================================== */

function openOptionBuilder(type) {
    currentOptionType = type;
    optionOverlay.style.display = "flex";
    optionTitle.textContent = `Create ${type}`;
    optionLabel.value = "";
    optionList.innerHTML = "";
    addOptionInput();
}

function closeOptionBuilder() {
    optionOverlay.style.display = "none";
}

function addOptionInput() {
    const row = document.createElement("div");
    row.className = "option-row";

    row.innerHTML = `
        <input class="form-control option-input" placeholder="Option value">
        <button class="btn btn-sm btn-danger"
            onclick="this.parentElement.remove()">✖</button>
    `;

    optionList.appendChild(row);
}

function createOptionField() {
    const label = optionLabel.value.trim();
    if (!label) return alert("Enter label");

    const options = [...optionList.querySelectorAll(".option-input")]
        .map(i => i.value.trim()).filter(Boolean);

    if (!options.length) return alert("Add options");

    const field = { type: currentOptionType, label, options };
    formStore[selectedNodeId] ??= [];
    formStore[selectedNodeId].push(field);

    const wrap = document.querySelector(".form-fields-wrapper");
    renderFieldFromStore(field, wrap);
    closeOptionBuilder();
}

/* =====================================================
   EXPOSE
===================================================== */

window.loadForm = loadForm;
window.addOptionInput = addOptionInput;
window.closeOptionBuilder = closeOptionBuilder;
window.createOptionField = createOptionField;
