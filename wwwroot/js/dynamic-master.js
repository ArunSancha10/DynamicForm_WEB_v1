/* =====================================================
   GLOBAL STATE
===================================================== */

let masterData = [];

/* =====================================================
   LOAD MASTER
===================================================== */

window.onload = async () => {
    await loadMaster();
};

async function loadMaster() {
    const res = await fetch("/dynamic-master/get");
    const data = await res.json();
    masterData = Array.isArray(data) ? data : [];
    renderSidebar(masterData);
}

/* =====================================================
   SIDEBAR
===================================================== */

function renderSidebar(data) {
    const sidebar = document.getElementById("sidebarTree");
    sidebar.innerHTML = "";
    data.forEach(n => sidebar.appendChild(createSidebarNode(n, 0)));
}

function createSidebarNode(node, level) {
    const wrapper = document.createElement("div");
    const hasChildren = node.children?.length > 0;

    const row = document.createElement("div");
    row.className = "sidebar-node";
    row.style.paddingLeft = `${level * 16}px`;

    const toggle = document.createElement("span");
    toggle.className = "toggle-icon";
    toggle.textContent = hasChildren ? "▶" : "";

    const text = document.createElement("span");
    text.className = "sidebar-text";
    text.textContent = node.name;

    const childrenBox = document.createElement("div");
    childrenBox.className = "sidebar-children";
    childrenBox.style.display = "none";

    let rendered = false;

    function toggleExpand() {
        const open = childrenBox.style.display === "block";

        if (!open && !rendered) {
            node.children.forEach(c =>
                childrenBox.appendChild(createSidebarNode(c, level + 1))
            );
            rendered = true;
        }

        childrenBox.style.display = open ? "none" : "block";
        toggle.textContent = open ? "▶" : "▼";
    }

    // ▶ Toggle icon click → ONLY expand/collapse
    if (hasChildren) {
        toggle.onclick = e => {
            e.stopPropagation();
            toggleExpand();
        };
    }

    // 🟢 Text click behavior
    text.onclick = e => {
        e.stopPropagation();

        // Parent node → expand/collapse ONLY
        if (hasChildren) {
            toggleExpand();
            return;
        }

        // ✅ Leaf node → load ONLY your updated canvas
        loadForm(node);
    };

    row.append(toggle, text);
    wrapper.append(row, childrenBox);
    return wrapper;
}


/* =====================================================
   MASTER TREE EDITOR
===================================================== */

function openEditor() {
    overlay.style.display = "flex";
    headingContainer.innerHTML = "";
    masterData.forEach(h =>
        headingContainer.appendChild(createNodeFromJson(h, 1))
    );
}

function closeEditor() {
    overlay.style.display = "none";
}

function createNodeFromJson(data, level) {
    const node = createNode(data.name, data.id, level);
    const children = node.querySelector(".node-children");

    data.children?.forEach(c =>
        children.appendChild(createNodeFromJson(c, level + 1))
    );

    refreshToggle(node);
    return node;
}

function createNode(name = "", id = null, level = 1) {
    const node = document.createElement("div");
    node.className = "node";
    node.dataset.id = id ?? Date.now();
    node.dataset.level = level;

    node.innerHTML = `
        <div class="node-row">
            <span class="toggle-btn hidden" onclick="toggleNode(this)">▶</span>
            <input class="form-control" value="${name}">
            <button class="icon-btn" onclick="addChild(this)">➕</button>
            <button class="icon-btn danger" onclick="removeNode(this)">🗑️</button>
        </div>
        <div class="node-children"></div>
    `;
    return node;
}

function addChild(btn) {
    const parent = btn.closest(".node");
    const container = parent.querySelector(".node-children");
    const level = +parent.dataset.level + 1;

    container.appendChild(createNode("", null, level));
    refreshToggle(parent);
}

function removeNode(btn) {
    const node = btn.closest(".node");
    const parent = node.parentElement.closest(".node");
    node.remove();
    if (parent) refreshToggle(parent);
}

function toggleNode(el) {
    const node = el.closest(".node");
    const children = node.querySelector(".node-children");
    const collapsed = children.style.display === "none";
    children.style.display = collapsed ? "block" : "none";
    el.textContent = collapsed ? "▼" : "▶";
}

function refreshToggle(node) {
    const toggle = node.querySelector(".toggle-btn");
    const children = node.querySelector(".node-children");

    if (!children.children.length) {
        toggle.classList.add("hidden");
        children.style.display = "none";
    } else {
        toggle.classList.remove("hidden");
        toggle.textContent = "▼";
        children.style.display = "block";
    }
}

/* =====================================================
   SAVE MASTER
===================================================== */

async function saveAll() {
    const result = [];
    document.querySelectorAll("#headingContainer > .node")
        .forEach((n, i) => result.push(buildJson(n, null, i + 1)));

    masterData = result;

    await fetch("/dynamic-master/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterData)
    });

    renderSidebar(masterData);
    closeEditor();

    Swal.fire({
        icon: "success",
        title: "Saved successfully",
        timer: 1500,
        showConfirmButton: false
    });
}

function buildJson(node, parentId, order) {
    return {
        id: node.dataset.id,
        name: node.querySelector("input").value.trim(),
        parentId,
        order,
        children: [...node.querySelectorAll(":scope > .node-children > .node")]
            .map((c, i) => buildJson(c, node.dataset.id, i + 1))
    };
}

/* =====================================================
   EXPOSE
===================================================== */

window.openEditor = openEditor;
window.closeEditor = closeEditor;
window.saveAll = saveAll;
