(function () {
  const appConfig = {
    "meeting-notes": {
      key: "oc-meeting-notes",
      fields: ["date", "title", "notes"],
      order: ["date", "title", "notes"],
      sort: (a, b) => (b.date || "").localeCompare(a.date || "")
    },
    "yearly-planning": {
      key: "oc-yearly-planning",
      fields: ["month", "planner", "event", "venue", "status", "notes"],
      order: ["month", "planner", "event", "venue", "status", "notes"],
      sort: (a, b) => monthIndex(a.month) - monthIndex(b.month),
      upsertBy: "month"
    },
    "event-records": {
      key: "oc-event-records",
      fields: ["date", "name", "venue", "ride", "organizer", "attendance", "notes", "flyer", "photo"],
      order: ["date", "name", "venue", "ride", "organizer", "attendance", "notes", "flyer", "photo"],
      sort: (a, b) => (b.date || "").localeCompare(a.date || ""),
      afterRender: updateEventMetrics
    },
    "ride-compendium": {
      key: "oc-ride-compendium",
      fields: ["name", "status", "difficulty", "distance", "duration", "scenic", "stops", "notes"],
      order: ["name", "status", "difficulty", "distance", "duration", "scenic", "stops", "notes"],
      sort: (a, b) => (a.name || "").localeCompare(b.name || "")
    },
    credentials: {
      key: "oc-credentials",
      fields: ["service", "username", "notes", "updated"],
      order: ["service", "username", "notes", "updated"],
      sort: (a, b) => (a.service || "").localeCompare(b.service || "")
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function monthIndex(month) {
    const index = months.indexOf(month);
    return index === -1 ? 99 : index;
  }

  function readRecords(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function writeRecords(key, records) {
    localStorage.setItem(key, JSON.stringify(records));
  }

  function getFormData(form, fields) {
    const data = {};
    fields.forEach((field) => {
      const input = form.elements[field];
      data[field] = input ? input.value.trim() : "";
    });
    data.id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    return data;
  }

  function makeCell(value, field) {
    const cell = document.createElement("td");
    if ((field === "flyer" || field === "photo") && value) {
      const link = document.createElement("a");
      link.href = value;
      link.textContent = field === "flyer" ? "Flyer" : "Photo";
      link.target = "_blank";
      link.rel = "noopener";
      cell.appendChild(link);
      return cell;
    }
    cell.textContent = value || "";
    return cell;
  }

  function renderApp(root, config) {
    const tbody = root.querySelector("[data-entry-rows]");
    if (!tbody) return;
    const records = readRecords(config.key).sort(config.sort);
    tbody.textContent = "";
    records.forEach((record) => {
      const row = document.createElement("tr");
      config.order.forEach((field) => row.appendChild(makeCell(record[field], field)));
      const actionCell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inline-action";
      button.textContent = "Delete";
      button.addEventListener("click", () => {
        writeRecords(config.key, readRecords(config.key).filter((item) => item.id !== record.id));
        renderApp(root, config);
      });
      actionCell.appendChild(button);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    });
    if (config.afterRender) config.afterRender(root, records);
  }

  function setupEntryApp(root) {
    const name = root.getAttribute("data-oc-app");
    const config = appConfig[name];
    if (!config) return;

    const form = root.querySelector("[data-entry-form]");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const records = readRecords(config.key);
        const data = getFormData(form, config.fields);
        if (config.upsertBy && data[config.upsertBy]) {
          const existingIndex = records.findIndex((record) => record[config.upsertBy] === data[config.upsertBy]);
          if (existingIndex >= 0) {
            data.id = records[existingIndex].id;
            records.splice(existingIndex, 1, data);
          } else {
            records.push(data);
          }
        } else {
          records.push(data);
        }
        writeRecords(config.key, records);
        form.reset();
        renderApp(root, config);
      });
    }

    root.querySelectorAll("[data-clear-form]").forEach((button) => {
      button.addEventListener("click", () => form && form.reset());
    });

    root.querySelectorAll("[data-sort-records]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.getAttribute("data-sort-records");
        const records = readRecords(config.key).sort((a, b) => {
          return direction === "date-asc"
            ? (a.date || "").localeCompare(b.date || "")
            : (b.date || "").localeCompare(a.date || "");
        });
        writeRecords(config.key, records);
        renderApp(root, { ...config, sort: () => 0 });
      });
    });

    renderApp(root, config);
  }

  function updateEventMetrics(root, records) {
    const count = root.querySelector("[data-event-count]");
    const total = root.querySelector("[data-attendance-total]");
    if (count) count.textContent = String(records.length);
    if (total) {
      total.textContent = String(records.reduce((sum, record) => {
        const attendance = Number(record.attendance || 0);
        return sum + (Number.isFinite(attendance) ? attendance : 0);
      }, 0));
    }
  }

  function setupVenueTable() {
    const controls = document.querySelector("[data-venue-controls]");
    if (!controls) return;
    const table = controls.nextElementSibling;
    if (!table || table.tagName !== "TABLE") return;
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const categorySelect = controls.querySelector("[data-filter-category]");
    const sortSelect = controls.querySelector("[data-sort-venue]");
    const categories = Array.from(new Set(rows.map((row) => row.children[1].textContent.trim()).filter(Boolean))).sort();

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    function applyVenueControls() {
      const category = categorySelect.value;
      const mode = sortSelect.value;
      const sorted = rows.slice().sort((a, b) => {
        if (mode === "visited-desc" || mode === "visited-asc") {
          const compare = a.children[3].textContent.trim().localeCompare(b.children[3].textContent.trim());
          return mode === "visited-desc" ? -compare : compare;
        }
        return a.children[0].textContent.trim().localeCompare(b.children[0].textContent.trim());
      });
      tbody.textContent = "";
      sorted.forEach((row) => {
        const visible = !category || row.children[1].textContent.trim() === category;
        row.hidden = !visible;
        tbody.appendChild(row);
      });
    }

    categorySelect.addEventListener("change", applyVenueControls);
    sortSelect.addEventListener("change", applyVenueControls);
    applyVenueControls();
  }

  function init() {
    document.querySelectorAll("[data-oc-app]").forEach(setupEntryApp);
    setupVenueTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
