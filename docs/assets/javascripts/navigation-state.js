(function () {
  var storageKey = "oc-litas-nav-expanded";

  function readState() {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    } catch (_error) {
      return {};
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_error) {
      // Browsing still works when storage is unavailable.
    }
  }

  function applyState() {
    var state = readState();
    var toggles = document.querySelectorAll(".md-sidebar--primary .md-nav__toggle[id]");

    toggles.forEach(function (toggle) {
      if (Object.prototype.hasOwnProperty.call(state, toggle.id)) {
        toggle.checked = !!state[toggle.id];
      }
    });
  }

  function saveToggle(toggle) {
    if (!toggle || !toggle.id) {
      return;
    }

    var state = readState();
    state[toggle.id] = toggle.checked;
    writeState(state);
  }

  function bindState() {
    var toggles = document.querySelectorAll(".md-sidebar--primary .md-nav__toggle[id]");

    toggles.forEach(function (toggle) {
      if (toggle.dataset.ocStateBound === "true") {
        return;
      }

      toggle.dataset.ocStateBound = "true";
      toggle.addEventListener("change", function () {
        saveToggle(toggle);
      });
    });

    document.querySelectorAll(".md-sidebar--primary label.md-nav__link[for]").forEach(function (label) {
      if (label.dataset.ocStateBound === "true") {
        return;
      }

      label.dataset.ocStateBound = "true";
      label.addEventListener("click", function () {
        window.setTimeout(function () {
          saveToggle(document.getElementById(label.getAttribute("for")));
        }, 0);
      });
    });
  }

  function init() {
    applyState();
    bindState();
    window.setTimeout(applyState, 0);
    window.setTimeout(applyState, 120);
  }

  document.addEventListener("DOMContentLoaded", init);

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  }
})();
