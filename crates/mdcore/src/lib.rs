//! Byte-preserving markdown documents and shared HTML rendering.

mod document;
pub use document::Document;

use pulldown_cmark::{Parser, html};

/// Render CommonMark to HTML without changing the source.
pub fn render(source: &str) -> String {
    let mut output = String::new();
    html::push_html(&mut output, Parser::new(source));
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
