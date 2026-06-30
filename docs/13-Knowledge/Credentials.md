# Credentials

Use this page to track where chapter accounts live without storing passwords in the repository.

!!! warning "Do not store passwords here"
    Leave password fields out of this file. Passwords should live in a secure password manager or a future encrypted vault.

<section class="tool-panel" data-oc-app="credentials">
  <form class="entry-form" data-entry-form>
    <div class="form-grid">
      <label>
        Service
        <input name="service" type="text" placeholder="Instagram, Canva, email, calendar" required>
      </label>
      <label>
        Username
        <input name="username" type="text">
      </label>
      <label>
        Last Updated
        <input name="updated" type="date">
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea name="notes" rows="3" placeholder="Owner, recovery contact, where access is stored, renewal notes, or handoff context."></textarea>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">Save Credential Note</button>
      <button type="button" data-clear-form>Clear</button>
    </div>
  </form>

  <table class="data-table">
    <thead>
      <tr>
        <th>Service</th>
        <th>Username</th>
        <th>Notes</th>
        <th>Last Updated</th>
        <th></th>
      </tr>
    </thead>
    <tbody data-entry-rows></tbody>
  </table>
</section>
