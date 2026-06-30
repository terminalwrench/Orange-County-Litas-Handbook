# Meeting Notes

Use this during leadership check-ins. Notes are saved in this browser.

<section class="tool-panel" data-oc-app="meeting-notes">
  <form class="entry-form" data-entry-form>
    <div class="form-grid">
      <label>
        Meeting Date
        <input name="date" type="date" required>
      </label>
      <label>
        Meeting Title
        <input name="title" type="text" placeholder="Leadership check-in" required>
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea class="note-editor" name="notes" rows="12" placeholder="Notes, decisions, action items, follow-ups, ideas, and future reference." required></textarea>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">Save Note</button>
      <button type="button" data-clear-form>Clear</button>
    </div>
  </form>

  <div class="table-tools">
    <strong>Previous Notes</strong>
    <button type="button" data-sort-records="date-desc">Newest First</button>
    <button type="button" data-sort-records="date-asc">Oldest First</button>
  </div>

  <div class="note-list" data-entry-list></div>
</section>
