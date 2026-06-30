# Route Library

Use this compendium for previous rides and future ride ideas. Entries are saved in this browser so ride leads can collect useful context before a route becomes a permanent record.

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
          <option>Previous Ride</option>
          <option>Future Ride Idea</option>
        </select>
      </label>
      <label>
        Difficulty
        <select name="difficulty">
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
      <label>
        Duration
        <input name="duration" type="text" placeholder="Approx. ride time">
      </label>
      <label>
        Scenic Rating
        <select name="scenic">
          <option>Not Rated</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
        </select>
      </label>
      <label class="form-grid-wide">
        Favorite Stops
        <input name="stops" type="text" placeholder="Fuel, food, photo, regroup, or destination stops">
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea name="notes" rows="4" placeholder="Ride notes, lessons, road conditions, parking, weather, flyer, or event image links."></textarea>
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
        <th>Difficulty</th>
        <th>Distance</th>
        <th>Duration</th>
        <th>Scenic</th>
        <th>Favorite Stops</th>
        <th>Notes</th>
        <th></th>
      </tr>
    </thead>
    <tbody data-entry-rows></tbody>
  </table>
</section>

## Permanent Route Folders

Route files are organized by primary ride category. Add only routes that have been planned, tested, completed, or reviewed with direct chapter knowledge.

- Beginner
- Intermediate
- Advanced
- Coffee
- Beach
- Scenic
- Mountains
- Food
- Destination
