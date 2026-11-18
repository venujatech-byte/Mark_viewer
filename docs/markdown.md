# Markdown and frontmatter

Mark parses CommonMark with tables, task lists, footnotes and strikethrough. It
renders fenced code blocks with Highlight.js for supported languages; unknown
languages remain escaped plain code. Heading anchors are generated in the host.

A YAML frontmatter block is recognized only at the start of the file, after an
optional UTF-8 BOM. It begins with `---` and ends with `---` or `...`. Mark shows
the content in a collapsed Frontmatter disclosure and renders the Markdown body
below it. It does not parse, normalize, or rewrite YAML. Comments, spacing,
delimiters, newline bytes and trailing spaces remain part of the source.

Raw HTML is displayed as text. Markdown links are limited to HTTP(S), mail links,
fragments and relative paths. Hosts handle navigation and constrain local images.
The renderer returns an HTML fragment; it must be displayed under the host's
content security policy.
