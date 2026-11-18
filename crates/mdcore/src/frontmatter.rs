/// Borrow the YAML header and markdown body without parsing or rewriting YAML.
/// An unclosed header is ordinary markdown so incomplete edits remain visible.
pub fn split_frontmatter(source: &str) -> (Option<&str>, &str) {
    let text = source.strip_prefix('\u{feff}').unwrap_or(source);
    let mut lines = text.split_inclusive('\n');
    let Some(first) = lines.next() else {
        return (None, text);
    };
    if first.trim_end_matches(['\r', '\n']) != "---" || !first.ends_with('\n') {
        return (None, text);
    }
    let start = first.len();
    let mut offset = start;
    for line in lines {
        if matches!(line.trim_end_matches(['\r', '\n']), "---" | "...") {
            return (Some(&text[start..offset]), &text[offset + line.len()..]);
        }
        offset += line.len();
    }
    (None, text)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn borrows_frontmatter_without_losing_comments_or_spacing() {
        let source = "---\nname: skill\n# comment\nvalue: 'a:b'  \n---\n\n# Body\n";
        let (metadata, body) = split_frontmatter(source);
        assert_eq!(metadata, Some("name: skill\n# comment\nvalue: 'a:b'  \n"));
        assert_eq!(body, "\n# Body\n");
        assert_eq!(source, format!("---\n{}---\n{body}", metadata.unwrap()));
    }
}
