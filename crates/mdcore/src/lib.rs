//! Byte-preserving markdown documents and shared HTML rendering.

mod document;
pub use document::Document;

use pulldown_cmark::{Event, Parser, Tag, html};

/// Render CommonMark to HTML without changing the source.
pub fn render(source: &str) -> String {
    let mut output = String::new();
    let events = Parser::new(source).map(|event| match event {
        Event::Html(text) | Event::InlineHtml(text) => Event::Text(text),
        Event::Start(Tag::Link {
            link_type,
            dest_url,
            title,
            id,
        }) => {
            let dest_url = if safe_url(&dest_url, false) {
                dest_url
            } else {
                "".into()
            };
            Event::Start(Tag::Link {
                link_type,
                dest_url,
                title,
                id,
            })
        }
        Event::Start(Tag::Image {
            link_type,
            dest_url,
            title,
            id,
        }) => {
            let dest_url = if safe_url(&dest_url, true) {
                dest_url
            } else {
                "".into()
            };
            Event::Start(Tag::Image {
                link_type,
                dest_url,
                title,
                id,
            })
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
