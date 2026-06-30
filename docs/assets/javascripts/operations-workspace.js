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

  const featureFlags = {
    chapterNotes: false
  };

  /**
   * @typedef {Object} DashboardEvent
   * @property {string} title
   * @property {string} month
   * @property {string} day
   * @property {string} weekday
   * @property {string} time
   * @property {string} dateLine
   * @property {string} venue
   * @property {string} location
   * @property {string} href
   */

  /**
   * @typedef {Object} DashboardDeadline
   * @property {string} title
   * @property {string} due
   * @property {string} date
   */

  /**
   * @typedef {Object} DashboardBirthday
   * @property {string} name
   * @property {string} initials
   * @property {string} date
   */

  /**
   * @typedef {Object} DashboardWeather
   * @property {string} eventDate
   * @property {string} label
   * @property {string} temperature
   * @property {string} condition
   * @property {string} rain
   * @property {string} wind
   * @property {string} humidity
   */

  const homeDashboardData = {
    referenceDate: "2026-07-07",
    sidebarCountdown: {
      iconLabel: "Calendar",
      days: 2,
      label: "until the Chapter Ride"
    },
    nextEvent: {
      title: "Old World Meet & Greet",
      month: "Jul",
      day: "9",
      weekday: "Wed",
      time: "6:30 PM",
      dateLine: "Wednesday, Jul 9",
      venue: "Old World Biergarten",
      location: "Huntington Beach, CA",
      startsInDays: 2,
      checklist: ["Venue Confirmed", "Route Complete", "Flyer Posted", "Email Sent"]
    },
    upcomingEvents: [
      {
        title: "Chapter Ride",
        month: "Jul",
        day: "25",
        time: "TBD",
        href: "10-Events-Database/Events-Index/"
      },
      {
        title: "Meet & Greet",
        month: "Aug",
        day: "5",
        time: "TBD",
        href: "10-Events-Database/Events-Index/"
      },
      {
        title: "Litas Beach Day",
        month: "Aug",
        day: "15",
        time: "All Day",
        href: "10-Events-Database/Events-Index/"
      }
    ],
    deadlines: [
      { title: "Email reminder", due: "Tomorrow", date: "2026-07-08" },
      { title: "Confirm reservation", due: "Jul 8", date: "2026-07-08" },
      { title: "Finalize route", due: "Jul 10", date: "2026-07-10" },
      { title: "Order patches", due: "Jul 11", date: "2026-07-11" }
    ],
    birthdays: [
      { name: "Emily", initials: "EM", date: "Jul 4" },
      { name: "Rachel", initials: "RA", date: "Jul 8" },
      { name: "Stephanie", initials: "ST", date: "Jul 13" }
    ],
    rideWeather: {
      eventDate: "2026-07-12",
      label: "Ride Weather (Sat, Jul 12)",
      temperature: "72°",
      condition: "Sunny",
      rain: "0%",
      wind: "18 mph",
      humidity: "64%"
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function calendarIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>
        <path d="M8 14h3M13 14h3M8 17h3M13 17h3"/>
      </svg>
    `;
  }

  function clockIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    `;
  }

  function pinIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
        <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      </svg>
    `;
  }

  function arrowIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M13 6l6 6-6 6"/>
      </svg>
    `;
  }

  function sunIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
      </svg>
    `;
  }

  function checkIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="m7 12 3 3 7-7"/>
      </svg>
    `;
  }

  function linkArrow(label) {
    return `<span>${escapeHtml(label)}</span>${arrowIcon()}`;
  }

  function parseLocalDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function isSameOperationalWeek(dateValue, referenceValue) {
    if (!dateValue) return false;
    const date = parseLocalDate(dateValue);
    const reference = parseLocalDate(referenceValue || new Date().toISOString().slice(0, 10));
    const day = reference.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(reference);
    start.setDate(reference.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  function upcomingDeadlinesWithinFiveDays(deadlines, referenceValue) {
    const reference = parseLocalDate(referenceValue);
    reference.setHours(0, 0, 0, 0);
    const end = new Date(reference);
    end.setDate(reference.getDate() + 5);
    end.setHours(23, 59, 59, 999);
    return deadlines.filter((deadline) => {
      const due = parseLocalDate(deadline.date);
      return due >= reference && due <= end;
    });
  }

  function renderNextEvent(root, event) {
    root.innerHTML = `
      <div class="oc-panel-title">Next Event</div>
      <div class="oc-next-event-layout">
        <div class="oc-date-tile" aria-label="${escapeHtml(`${event.month} ${event.day}, ${event.weekday}`)}">
          <span>${escapeHtml(event.month)}</span>
          <strong>${escapeHtml(event.day)}</strong>
          <em>${escapeHtml(event.weekday)}</em>
        </div>
        <div class="oc-next-event-details">
          <h2>${escapeHtml(event.title)}</h2>
          <p>${clockIcon()}<span>${escapeHtml(`${event.time}, ${event.dateLine}`)}</span></p>
          <p>${pinIcon()}<span>${escapeHtml(event.venue)}<br><em>${escapeHtml(event.location)}</em></span></p>
        </div>
        <div class="oc-starts-in" aria-label="${escapeHtml(`Starts in ${event.startsInDays} days`)}">
          <span>Starts in</span>
          <strong>${escapeHtml(event.startsInDays)}</strong>
          <em>Days</em>
        </div>
      </div>
      <div class="oc-checklist-row" aria-label="Event checklist">
        ${event.checklist.map((item) => `
          <span class="oc-check-pill">${checkIcon()}${escapeHtml(item)}</span>
        `).join("")}
      </div>
    `;
  }

  function renderUpcomingEvents(root, events) {
    root.innerHTML = `
      <section class="oc-panel oc-list-panel" aria-labelledby="upcoming-events-title">
        <div class="oc-panel-title" id="upcoming-events-title">Upcoming Events</div>
        <div class="oc-event-list">
          ${events.map((event) => `
            <a class="oc-event-row" href="${escapeHtml(event.href)}">
              <span class="oc-mini-date"><em>${escapeHtml(event.month)}</em><strong>${escapeHtml(event.day)}</strong></span>
              <span class="oc-row-copy"><strong>${escapeHtml(event.title)}</strong><em>${escapeHtml(event.time)}</em></span>
            </a>
          `).join("")}
        </div>
        <a class="oc-panel-link" href="10-Events-Database/Events-Index/">${linkArrow("View all events")}</a>
      </section>
    `;
  }

  function renderDeadlines(root, deadlines) {
    root.innerHTML = `
      <section class="oc-panel oc-list-panel" aria-labelledby="deadlines-title">
        <div class="oc-panel-title" id="deadlines-title">Upcoming Deadlines</div>
        <div class="oc-deadline-list">
          ${deadlines.map((deadline) => `
            <div class="oc-deadline-row">
              <span class="oc-row-icon">${calendarIcon()}</span>
              <strong>${escapeHtml(deadline.title)}</strong>
              <em>${escapeHtml(deadline.due)}</em>
            </div>
          `).join("")}
        </div>
        <a class="oc-panel-link" href="02-Events/Event-Lifecycle/">${linkArrow("View all deadlines")}</a>
      </section>
    `;
  }

  function renderBirthdays(root, birthdays) {
    root.innerHTML = `
      <section class="oc-panel oc-birthday-panel" aria-labelledby="birthdays-title">
        <div class="oc-panel-heading">
          <div class="oc-panel-title" id="birthdays-title">Upcoming Birthdays</div>
          <a href="13-Knowledge/Resources/">View all</a>
        </div>
        <div class="oc-birthday-list">
          ${birthdays.map((birthday) => `
            <div class="oc-birthday-row">
              <span class="oc-avatar" aria-hidden="true">${escapeHtml(birthday.initials)}</span>
              <span><strong>${escapeHtml(birthday.name)}</strong><em>${escapeHtml(birthday.date)}</em></span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderRideWeather(root, weather, referenceDate) {
    if (!isSameOperationalWeek(weather.eventDate, referenceDate)) {
      root.textContent = "";
      root.hidden = true;
      return;
    }
    root.hidden = false;
    root.innerHTML = `
      <section class="oc-panel oc-weather-panel" aria-labelledby="ride-weather-title">
        <div class="oc-panel-title" id="ride-weather-title">${escapeHtml(weather.label)}</div>
        <div class="oc-weather-layout">
          <span class="oc-sun-icon">${sunIcon()}</span>
          <span class="oc-temp"><strong>${escapeHtml(weather.temperature)}</strong><em>${escapeHtml(weather.condition)}</em></span>
          <span><strong>${escapeHtml(weather.rain)}</strong><em>Rain</em></span>
          <span><strong>${escapeHtml(weather.wind)}</strong><em>Wind</em></span>
          <span><strong>${escapeHtml(weather.humidity)}</strong><em>Humidity</em></span>
        </div>
      </section>
    `;
  }

  function renderChapterNotes(root) {
    if (!root) return;
    // TODO: Revisit Chapter Notes after evaluating long-term note synchronization options.
    if (!featureFlags.chapterNotes) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    root.innerHTML = `
      <div class="oc-panel-title">Chapter Notes</div>
      <p>Notes sync is not enabled yet.</p>
    `;
  }

  function setupHomeDashboard() {
    const root = document.querySelector("[data-home-dashboard]");
    document.body.classList.toggle("oc-home-active", Boolean(root));
    if (!root || root.dataset.ocReady === "true") return;
    root.dataset.ocReady = "true";

    renderNextEvent(root.querySelector("[data-next-event]"), homeDashboardData.nextEvent);
    renderUpcomingEvents(root.querySelector("[data-upcoming-events]"), homeDashboardData.upcomingEvents);
    renderDeadlines(
      root.querySelector("[data-upcoming-deadlines]"),
      upcomingDeadlinesWithinFiveDays(homeDashboardData.deadlines, homeDashboardData.referenceDate)
    );
    renderBirthdays(root.querySelector("[data-upcoming-birthdays]"), homeDashboardData.birthdays);
    renderRideWeather(
      root.querySelector("[data-ride-weather]"),
      homeDashboardData.rideWeather,
      homeDashboardData.referenceDate
    );
    renderChapterNotes(root.querySelector("[data-chapter-notes]"));
  }

  function setupSidebarCountdown() {
    const nav = document.querySelector(".md-sidebar--primary .md-nav--primary");
    if (!nav || nav.querySelector(".oc-sidebar-countdown")) return;
    const countdown = homeDashboardData.sidebarCountdown;
    const element = document.createElement("aside");
    element.className = "oc-sidebar-countdown";
    element.setAttribute("aria-label", `${countdown.days} days ${countdown.label}`);
    element.innerHTML = `
      <span class="oc-row-icon">${calendarIcon()}</span>
      <span><strong>${escapeHtml(countdown.days)} days</strong><em>${escapeHtml(countdown.label)}</em></span>
    `;
    nav.appendChild(element);
  }

  function setupHeaderCalendarShortcut() {
    const inner = document.querySelector(".md-header__inner");
    if (!inner || inner.querySelector(".oc-calendar-shortcut")) return;
    const link = document.createElement("a");
    link.className = "oc-calendar-shortcut";
    link.href = "01-Chapter/Calendar/";
    link.setAttribute("aria-label", "Open chapter calendar");
    link.innerHTML = calendarIcon();
    inner.appendChild(link);
  }

  function init() {
    document.querySelectorAll("[data-oc-app]").forEach(setupEntryApp);
    setupHomeDashboard();
    setupVenueTable();
    setupAttendanceSummary();
    setupSidebarAccordion();
    setupSidebarCountdown();
    setupHeaderCalendarShortcut();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
