# Yearly Planning Board

Use this board to keep the year visible at a glance. Entries are saved in this browser and can be updated as planning firms up.

<section class="tool-panel" data-oc-app="yearly-planning">
  <form class="entry-form" data-entry-form>
    <div class="form-grid">
      <label>
        Month
        <select name="month" required>
          <option value="">Choose month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
          <option>May</option>
          <option>June</option>
          <option>July</option>
          <option>August</option>
          <option>September</option>
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>
      </label>
      <label>
        Planner
        <input name="planner" type="text">
      </label>
      <label>
        Event
        <input name="event" type="text">
      </label>
      <label>
        Venue
        <input name="venue" type="text">
      </label>
      <label>
        Status
        <select name="status">
          <option>Idea</option>
          <option>Planning</option>
          <option>Confirmed</option>
          <option>Complete</option>
        </select>
      </label>
      <label class="form-grid-wide">
        Notes
        <textarea name="notes" rows="3"></textarea>
      </label>
    </div>
    <div class="form-actions">
      <button type="submit">Save Month</button>
      <button type="button" data-clear-form>Clear</button>
    </div>
  </form>

  <table class="data-table">
    <thead>
      <tr>
        <th>Month</th>
        <th>Planner</th>
        <th>Event</th>
        <th>Venue</th>
        <th>Status</th>
        <th>Notes</th>
        <th></th>
      </tr>
    </thead>
    <tbody data-entry-rows></tbody>
  </table>
</section>

## Useful Links

- [Chapter Calendar](../01-Chapter/Calendar.md)
- [Events Index](../10-Events-Database/Events-Index.md)
- [Venue Index](../11-Venues/Venue-Index.md)
- [Ride Planner](../05-Routes/README.md)
