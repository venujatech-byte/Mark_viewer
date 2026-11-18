---
name: project-instructions
description: Read and edit the project's working notes.
# Preserve comments and original formatting.
---

# Project instructions

Keep the project's decisions close to the work. Read these notes before editing,
and leave them ready for the next person.

## Files that matter

| File | Purpose | Updated |
| :--- | :--- | ---: |
| AGENTS.md | Project instructions | Today |
| CLAUDE.md | Working context | Today |
| SKILL.md | A repeatable workflow | Yesterday |

## Before you save

- [x] Read the current instructions.
- [ ] Check the diff and run the tests.
- [ ] Keep comments and line endings intact.

> The source file is the document. The preview is a way to read it.

## A small Rust example

```rust
fn main() {
    let message = "Keep the original source.";
    println!("{message}");
}
```

Use `cargo test` to check a change. See the [project notes](./AGENTS.md) for the
full workflow, or return to [files that matter](#files-that-matter).

~~Rewrite the whole document~~ Change only what needs changing.[^preserve]

[^preserve]: Untouched source should stay byte-identical.
