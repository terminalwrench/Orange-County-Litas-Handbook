# Route Library

Use this compendium for completed rides and future ride ideas. Entries are saved in this browser so ride leads can keep route context, notes, flyers, and photos together.

<section class="tool-panel" data-oc-app="ride-compendium">
  <form class="entry-form" data-entry-form>
    <div class="form-grid">
      <label>
        Ride Name
        <input name="name" type="text" required>
      </label>
      <label>
        Status
        <select name="status">
          <option>Completed Ride</option>
          <option>Future Ride Idea</option>
        </select>
      </label>
      <label>
        Route
        <input name="route" type="text" placeholder="Roads, destination, or map link">
      </label>
      <label>
        Difficulty
        <select name="difficulty">
          <option></option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
          <option>Mixed</option>
        </select>
      </label>
      <label>
        Distance
        <input name="distance" type="text" placeholder="Approx. miles">
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea name="notes" rows="4" placeholder="Ride lead notes, lessons, road conditions, parking, weather, favorite stops, or rider suitability."></textarea>
      </label>
      <label>
        Flyer
        <input name="flyer" type="url" placeholder="https://">
      </label>
      <label class="form-grid-wide">
        Photos
        <input name="photos" type="url" placeholder="Gallery or folder link">
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">Save Ride</button>
      <button type="button" data-clear-form>Clear</button>
    </div>
  </form>

  <table class="data-table">
    <thead>
      <tr>
        <th>Ride</th>
        <th>Status</th>
        <th>Route</th>
        <th>Difficulty</th>
        <th>Distance</th>
        <th>Notes</th>
        <th>Flyer</th>
        <th>Photos</th>
        <th></th>
      </tr>
    </thead>
    <tbody data-entry-rows></tbody>
  </table>
</section>

Ride Lead Notes belong in the matching ride or event record so future leaders can see route, flyer, photos, attendance, lessons, and ride context in one place.
