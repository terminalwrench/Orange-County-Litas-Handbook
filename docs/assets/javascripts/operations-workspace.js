(function () {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const appConfig = {
    "meeting-notes": {
      key: "oc-meeting-notes",
      fields: ["date", "title", "notes"],
      order: ["date", "title", "notes"],
      sort: (a, b) => (b.date || "").localeCompare(a.date || ""),
      layout: "cards"
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
      fields: ["name", "status", "route", "difficulty", "distance", "notes", "flyer", "photos"],
      order: ["name", "status", "route", "difficulty", "distance", "notes", "flyer", "photos"],
      sort: (a, b) => (a.name || "").localeCompare(b.name || "")
    },
    credentials: {
      key: "oc-credentials",
      fields: ["service", "username", "notes", "updated"],
      order: ["service", "username", "notes", "updated"],
      sort: (a, b) => (a.service || "").localeCompare(b.service || "")
    }
  };

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
    const idInput = form.elements.id;
    data.id = idInput && idInput.value
      ? idInput.value
      : window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    return data;
  }

  function makeCell(value, field) {
    const cell = document.createElement("td");
    if ((field === "flyer" || field === "photo" || field === "photos") && value) {
      const link = document.createElement("a");
      link.href = value;
      link.textContent = field === "flyer" ? "Flyer" : "Photos";
      link.target = "_blank";
      link.rel = "noopener";
      cell.appendChild(link);
      return cell;
    }
    cell.textContent = value || "";
    return cell;
  }

  function preview(text) {
    if (!text) return "No notes yet.";
    return text.length > 140 ? `${text.slice(0, 140).trim()}...` : text;
  }

  function renderCards(root, config, records) {
    const list = root.querySelector("[data-entry-list]");
    if (!list) return;
    list.textContent = "";
    if (!records.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No meeting notes saved yet.";
      list.appendChild(empty);
      return;
    }
    records.forEach((record) => {
      const card = document.createElement("article");
      card.className = "note-card";

      const meta = document.createElement("span");
      meta.className = "note-card__date";
      meta.textContent = record.date || "No date";

      const title = document.createElement("h2");
      title.textContent = record.title || "Untitled meeting";

      const summary = document.createElement("p");
      summary.textContent = preview(record.notes);

      const actions = document.createElement("div");
      actions.className = "note-card__actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "inline-action";
      edit.textContent = "Open/Edit";
      edit.addEventListener("click", () => {
        const form = root.querySelector("[data-entry-form]");
        if (!form) return;
        ensureIdField(form).value = record.id;
        config.fields.forEach((field) => {
          if (form.elements[field]) form.elements[field].value = record[field] || "";
        });
        const notes = form.elements.notes;
        if (notes) notes.focus();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "inline-action";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        writeRecords(config.key, readRecords(config.key).filter((item) => item.id !== record.id));
        renderApp(root, config);
      });

      actions.append(edit, remove);
      card.append(meta, title, summary, actions);
      list.appendChild(card);
    });
  }

  function renderTable(root, config, records) {
    const tbody = root.querySelector("[data-entry-rows]");
    if (!tbody) return;
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
  }

  function renderApp(root, config) {
    const records = readRecords(config.key).sort(config.sort);
    if (config.layout === "cards") {
      renderCards(root, config, records);
    } else {
      renderTable(root, config, records);
    }
    if (config.afterRender) config.afterRender(root, records);
  }

  function ensureIdField(form) {
    let input = form.elements.id;
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "id";
      form.prepend(input);
    }
    return input;
  }

  function setupEntryApp(root) {
    if (root.dataset.ocReady === "true") return;
    const name = root.getAttribute("data-oc-app");
    if (name === "yearly-planning") {
      root.dataset.ocReady = "true";
      setupYearlyPlanning(root);
      return;
    }

    const config = appConfig[name];
    if (!config) return;
    root.dataset.ocReady = "true";

    const form = root.querySelector("[data-entry-form]");
    if (form) {
      ensureIdField(form);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const records = readRecords(config.key);
        const data = getFormData(form, config.fields);
        const existingIndex = records.findIndex((record) => record.id === data.id);
        if (existingIndex >= 0) {
          records.splice(existingIndex, 1, data);
        } else {
          records.push(data);
        }
        writeRecords(config.key, records);
        form.reset();
        form.elements.id.value = "";
        renderApp(root, config);
      });
    }

    root.querySelectorAll("[data-clear-form]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!form) return;
        form.reset();
        form.elements.id.value = "";
      });
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

  function setupYearlyPlanning(root) {
    const key = "oc-yearly-planning";
    const records = readRecords(key);
    const byMonth = new Map(records.map((record) => [record.month, record]));
    root.querySelectorAll("[data-month-row]").forEach((row) => {
      const month = row.getAttribute("data-month-row");
      const record = byMonth.get(month) || { month };
      row.querySelectorAll("[data-field]").forEach((input) => {
        input.value = record[input.getAttribute("data-field")] || "";
        input.addEventListener("change", () => saveYearlyBoard(root, key));
        input.addEventListener("input", () => {
          window.clearTimeout(input._ocSaveTimer);
          input._ocSaveTimer = window.setTimeout(() => saveYearlyBoard(root, key), 350);
        });
      });
    });
  }

  function saveYearlyBoard(root, key) {
    const records = [];
    root.querySelectorAll("[data-month-row]").forEach((row) => {
      const month = row.getAttribute("data-month-row");
      const record = { month, id: month };
      row.querySelectorAll("[data-field]").forEach((input) => {
        record[input.getAttribute("data-field")] = input.value.trim();
      });
      records.push(record);
    });
    writeRecords(key, records);
  }

  function updateEventMetrics(root, records) {
    const count = root.querySelector("[data-event-count]");
    const total = root.querySelector("[data-attendance-total]");
    if (count) count.textContent = String(records.length);
    if (total) total.textContent = String(attendanceTotal(records));
  }

  function attendanceTotal(records) {
    return records.reduce((sum, record) => {
      const attendance = Number(record.attendance || 0);
      return sum + (Number.isFinite(attendance) ? attendance : 0);
    }, 0);
  }

  function setupAttendanceSummary() {
    document.querySelectorAll("[data-attendance-summary]").forEach((summary) => {
      const records = readRecords("oc-event-records");
      const count = summary.querySelector("[data-event-count]");
      const total = summary.querySelector("[data-attendance-total]");
      const average = summary.querySelector("[data-attendance-average]");
      if (count) count.textContent = String(records.length);
      if (total) total.textContent = String(attendanceTotal(records));
      if (average) {
        const values = records.map((record) => Number(record.attendance || 0)).filter((value) => value > 0);
        average.textContent = values.length ? String(Math.round(attendanceTotal(records) / values.length)) : "0";
      }
    });
  }

  function setupVenueTable() {
    const controls = document.querySelector("[data-venue-controls]");
    if (!controls || controls.dataset.ocReady === "true") return;
    const table = document.querySelector("[data-venue-table]");
    if (!table) return;
    controls.dataset.ocReady = "true";

    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const categorySelect = controls.querySelector("[data-filter-category]");
    const sortSelect = controls.querySelector("[data-sort-venue]");
    const favoriteButton = controls.querySelector("[data-filter-favorites]");
    const clearButton = controls.querySelector("[data-clear-venue-filters]");
    let favoritesOnly = false;
    const categories = Array.from(new Set(rows.map((row) => row.dataset.category).filter(Boolean))).sort();

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
          const compare = (a.dataset.lastVisited || "").localeCompare(b.dataset.lastVisited || "");
          return mode === "visited-desc" ? -compare : compare;
        }
        return a.dataset.venue.localeCompare(b.dataset.venue);
      });
      tbody.textContent = "";
      sorted.forEach((row) => {
        const matchesCategory = !category || row.dataset.category === category;
        const matchesFavorite = !favoritesOnly || row.dataset.favorite === "true";
        row.hidden = !(matchesCategory && matchesFavorite);
        tbody.appendChild(row);
      });
      if (favoriteButton) {
        favoriteButton.setAttribute("aria-pressed", String(favoritesOnly));
      }
    }

    categorySelect.addEventListener("change", applyVenueControls);
    sortSelect.addEventListener("change", applyVenueControls);
    if (favoriteButton) {
      favoriteButton.addEventListener("click", () => {
        favoritesOnly = !favoritesOnly;
        applyVenueControls();
      });
    }
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        favoritesOnly = false;
        categorySelect.value = "";
        sortSelect.value = "name-asc";
        applyVenueControls();
      });
    }
    applyVenueControls();
  }

  function setupSidebarAccordion() {
    const list = document.querySelector(".md-sidebar--primary .md-nav--primary > .md-nav__list");
    if (!list || list.dataset.ocAccordion === "true") return;
    list.dataset.ocAccordion = "true";
    const toggles = Array.from(list.querySelectorAll(":scope > .md-nav__item > .md-nav__toggle"));
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        if (!toggle.checked) return;
        toggles.forEach((other) => {
          if (other !== toggle) other.checked = false;
        });
      });
    });
  }

  function init() {
    document.querySelectorAll("[data-oc-app]").forEach(setupEntryApp);
    setupVenueTable();
    setupAttendanceSummary();
    setupSidebarAccordion();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
