/// Borrow the YAML header and markdown body without parsing or rewriting YAML.
/// An unclosed header is ordinary markdown so incomplete edits remain visible.
pub fn split_frontmatter(source: &str) -> (Option<&str>, &str) {
    let text = source.strip_prefix('\u{feff}').unwrap_or(source);
    let Some(first_end) = text.find(['\r', '\n']) else {
        return (None, text);
    };
    if &text[..first_end] != "---" {
        return (None, text);
    }
    let start = first_end
        + if text[first_end..].starts_with("\r\n") {
            2
        } else {
            1
        };
    let mut offset = start;
    while offset < text.len() {
        let end = text[offset..]
            .find(['\r', '\n'])
            .map_or(text.len(), |index| offset + index);
        let next = end
            + if text[end..].starts_with("\r\n") {
                2
            } else {
                usize::from(end < text.len())
            };
        if matches!(&text[offset..end], "---" | "...") {
            return (Some(&text[start..offset]), &text[next..]);
        }
        offset = next;
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
