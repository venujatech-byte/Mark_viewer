//! Byte-preserving markdown documents and shared HTML rendering.

mod document;
pub use document::Document;

use pulldown_cmark::{Event, Parser, html};

/// Render CommonMark to HTML without changing the source.
pub fn render(source: &str) -> String {
    let mut output = String::new();
    let events = Parser::new(source).map(|event| match event {
        Event::Html(text) | Event::InlineHtml(text) => Event::Text(text),
        other => other,
    });
    html::push_html(&mut output, events);
    output
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
