//! Byte-preserving markdown documents and shared HTML rendering.

mod document;
mod edit;
pub use edit::{apply_editor_text, editor_source, minimal_edit};
#[cfg(not(target_arch = "wasm32"))]
mod file;
#[cfg(not(target_arch = "wasm32"))]
pub use file::FileDocument;
mod frontmatter;
pub use document::Document;
pub use frontmatter::split_frontmatter;

use pulldown_cmark::{Event, Parser, Tag, html};

/// Render CommonMark to an HTML fragment without changing the source.
///
/// Raw HTML is escaped and active URL schemes are removed. The host must still
/// apply a content security policy and resolve relative resources safely.
///
/// ```
/// assert_eq!(mdcore::render("**hello**"), "<p><strong>hello</strong></p>\n");
/// ```
pub fn render(source: &str) -> String {
    let mut output = String::new();
    let (metadata, body) = split_frontmatter(source);
    if let Some(metadata) = metadata {
        output.push_str("<details class=\"frontmatter\"><summary>Frontmatter</summary><pre>");
        html::push_html(&mut output, [Event::Text(metadata.into())].into_iter());
        output.push_str("</pre></details>\n");
    }
    let events = Parser::new(body).map(|event| match event {
        Event::Html(text) | Event::InlineHtml(text) => Event::Text(text),
        Event::Start(mut tag) => {
            match &mut tag {
                Tag::Link { dest_url, .. } if !safe_url(dest_url, false) => *dest_url = "".into(),
                Tag::Image { dest_url, .. } if !safe_url(dest_url, true) => *dest_url = "".into(),
                _ => {}
            }
            Event::Start(tag)
        }
        other => other,
    });
    html::push_html(&mut output, events);
    output
}

/// Allow web URLs, mail links, fragments and relative paths; reject active schemes.
pub fn safe_url(url: &str, image: bool) -> bool {
    if url.chars().any(|c| c.is_control() || c == '\\') || url.starts_with("//") {
        return false;
    }
    let lower = url.to_ascii_lowercase();
    if lower.starts_with("https://") || lower.starts_with("http://") {
        return true;
    }
    if !image && lower.starts_with("mailto:") {
        return true;
    }
    !url.split(['/', '?', '#'])
        .next()
        .unwrap_or("")
        .contains(':')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_heading_and_paragraph() {
        assert_eq!(
            render("# Hello\n\nMarkdown."),
            "<h1>Hello</h1>\n<p>Markdown.</p>\n"
        );
    }
}
