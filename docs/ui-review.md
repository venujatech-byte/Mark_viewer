# Desktop UI review

Framed sheet, seed 1270020764, no redraws. The green-grey frame and book-shaped M
belong to Mark; the reading column, metadata disclosure and source/preview panes
carry the instruction file. The screen answers: “What does this file say?”

The visual fixture is `crates/mdcore/tests/fixtures/FEATURES.md`, using sample
instruction text and actual file conventions. It is test data, not a document
that the product inserts into the user's work.

Reviewed light and dark screenshots at 1440, 768 and 390 pixels, plus the desktop
edit pane. Chromium checks passed for horizontal overflow, active keyboard focus
and Ctrl+E. Native WebDriver checks startup, tab order and Rust rendering IPC.

The inspector reported zero failures. Its multiple-h1 warning is accepted: the
application names the file and the imported document keeps its heading semantics.
The linter's monospace warnings are accepted for source and literal code only.
No charts, illustrations, animation or sidebar are needed for this reader.

Visual fixes: remove duplicate task-list bullets and give checks sufficient
contrast; reset the cursor and scroll position when a new source file opens.
The source view then retains its cursor when toggled between editing and reading.
