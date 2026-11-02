/** @OnlyCurrentDoc */
/** Bound to the spreadsheet, executed manually. No triggers, no website calls.
 * Install only after testing on a fictional COPY. Never sort a partial range:
 * include the hidden Sync UUID column when sorting the complete table.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Guest identifiers')
    .addItem('Assign missing permanent IDs', 'assignMissingGuestIds').addToUi();
}
function assignMissingGuestIds() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Permanent guest IDs', 'Pause edits by all collaborators first. Confirm that nobody is sorting, moving or editing rows until this command finishes.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Guest List');
    if (!sheet) throw new Error('Guest List tab missing.');
    const rows = sheet.getDataRange().getValues();
    const names = rows[0];
    const nameIndex = names.indexOf('Guest name');
    if (nameIndex < 0) throw new Error('Guest name header missing.');
    if (names.filter(x => x === 'Sync UUID').length > 1) throw new Error('Duplicate Sync UUID columns.');
    if (names.filter(x => x === 'Surname').length > 1) throw new Error('Duplicate Surname columns.');
    let col = names.indexOf('Sync UUID');
    if (col < 0) col = names.length;
    const existing = new Set();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (let i = 1; i < rows.length; i++) {
      const id = String(rows[i][col] || '').trim().toLowerCase();
      if (id && (!uuid.test(id) || existing.has(id))) throw new Error('Invalid or duplicate permanent ID at row ' + (i + 1) + '. Nothing was written.');
      if (id) existing.add(id);
    }
    const required = [
      'Guest name', 'Guest type', 'Group', 'List owner',
      'Party / family', 'Planning status', 'Priority'
    ];

    for (const field of required) {
      if (names.filter(n => n === field).length !== 1)
        throw new Error('Missing or duplicate column: ' + field);
    }

    const get = (row, field) =>
      String(row[names.indexOf(field)] ?? '').trim();

    const output = [['Sync UUID']];
    let created = 0;
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const id = String(row[col] || '').trim();

      if (id) {
        output.push([id]);
        continue;
      }

      const complete =
        get(row, 'Guest name') !== '' &&
        ['Adult', 'Child'].includes(get(row, 'Guest type')) &&
        ['Ale', 'Bridget', 'Both'].includes(get(row, 'List owner')) &&
        ['Group', 'Party / family', 'Planning status', 'Priority']
          .every(field => get(row, field) !== '');

      if (!complete) {
        output.push(['']);
        if (get(row, 'Guest name')) skipped++;
        continue;
      }

      let next;
      do {
        next = Utilities.getUuid();
      } while (existing.has(next.toLowerCase()));

      existing.add(next.toLowerCase());
      output.push([next]);
      created++;
    }
    if (col >= sheet.getMaxColumns()) sheet.insertColumnAfter(sheet.getMaxColumns());
    sheet.getRange(1, col + 1, output.length, 1).setValues(output);
    SpreadsheetApp.flush();
    // Readback before reporting completion; a retry preserves any IDs already saved.
    const saved = sheet.getRange(1, col + 1, output.length, 1).getValues();
    if (JSON.stringify(saved) !== JSON.stringify(output)) throw new Error('Readback mismatch. Stop editing and inspect the column before retrying.');
    sheet.hideColumns(col + 1);
    ui.alert('Permanent IDs verified. New IDs: ' + created + '; incomplete named rows skipped: ' + skipped + '. You may resume editing and run Preview Sync.');
  } finally { lock.releaseLock(); }
}
