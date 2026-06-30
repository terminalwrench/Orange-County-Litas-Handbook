# Meeting Notes

Use this notebook during leadership check-ins. Notes are saved in this browser so leaders can capture decisions quickly without opening another app.

<section class="tool-panel" data-oc-app="meeting-notes">
  <form class="entry-form" data-entry-form>
    <div class="form-grid">
      <label>
        Meeting Date
        <input name="date" type="date" required>
      </label>
      <label>
        Title
        <input name="title" type="text" placeholder="Leadership check-in" required>
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea name="notes" rows="5" placeholder="Decisions, action items, follow-ups, and useful context." required></textarea>
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

  <table class="data-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Title</th>
        <th>Notes</th>
        <th></th>
      </tr>
    </thead>
    <tbody data-entry-rows></tbody>
  </table>
</section>

## Privacy

Summarize sensitive topics as operational themes. Do not store private conflict details, personal disclosures, or incident specifics in general meeting notes.
