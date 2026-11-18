use std::ops::Range;

/// Find the smallest single replacement, with UTF-8 boundaries on both strings.
pub fn minimal_edit<'a>(before: &str, after: &'a str) -> (Range<usize>, &'a str) {
    let prefix = before
        .chars()
        .zip(after.chars())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum();
    let suffix: usize = before[prefix..]
        .chars()
        .rev()
        .zip(after[prefix..].chars().rev())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum();
    (
        prefix..before.len() - suffix,
        &after[prefix..after.len() - suffix],
    )
}

/// Textareas normalize line endings; keep the original source outside each edit.
pub fn editor_source(source: &str) -> String {
    source
        .strip_prefix('\u{feff}')
        .unwrap_or(source)
        .replace("\r\n", "\n")
        .replace('\r', "\n")
}

/// Apply one source-editor input while preserving BOM and untouched line endings.
pub fn apply_editor_text(source: &str, updated: &str) -> String {
    let before = editor_source(source);
    let after = editor_source(updated);
    let (range, replacement) = minimal_edit(&before, &after);
    let text = source.strip_prefix('\u{feff}').unwrap_or(source);
    let bom = source.len() - text.len();
    let start = bom + original_offset(text, range.start);
    let end = bom + original_offset(text, range.end);
    let newline = match text.find(['\r', '\n']) {
        Some(i) if text[i..].starts_with("\r\n") => "\r\n",
        Some(i) if text[i..].starts_with('\r') => "\r",
        _ => "\n",
    };
    let mut result = source.to_owned();
    result.replace_range(start..end, &replacement.replace('\n', newline));
    result
}

fn original_offset(source: &str, target: usize) -> usize {
    let mut normalized = 0;
    let mut chars = source.char_indices().peekable();
    while let Some((index, ch)) = chars.next() {
        if normalized == target {
            return index;
        }
        if ch == '\r' && chars.peek().is_some_and(|(_, c)| *c == '\n') {
            chars.next();
        }
        normalized += ch.len_utf8();
    }
    source.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn minimal_edits_reconstruct_every_pair_of_unicode_inputs() {
        let cases = [
            "",
            "a",
            "aa",
            "🦀é\n",
            "🦀è\n",
            "# text\r\n",
            "prefix changed suffix",
            "prefix suffix",
        ];
        for before in cases {
            for after in cases {
                let (range, replacement) = minimal_edit(before, after);
                let mut actual = before.to_owned();
                actual.replace_range(range, replacement);
                assert_eq!(actual, after);
            }
        }
        assert_eq!(minimal_edit("a🦀z", "a界z"), (1..5, "界"));
    }
}
