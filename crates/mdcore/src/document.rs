#[cfg(not(target_arch = "wasm32"))]
use std::{fs, path::Path};
use std::{io, ops::Range};

/// A UTF-8 markdown source. Rendering never mutates this text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Document {
    source: String,
}

impl Document {
    pub fn new(source: String) -> Self {
        Self { source }
    }

    #[cfg(not(target_arch = "wasm32"))]
    pub fn read(path: impl AsRef<Path>) -> io::Result<Self> {
        fs::read_to_string(path).map(Self::new)
    }

    /// Replace a UTF-8 byte range, leaving all other bytes untouched.
    pub fn edit(&mut self, range: Range<usize>, replacement: &str) -> io::Result<()> {
        if self.source.get(range.clone()).is_none() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "edit must be an ordered UTF-8 byte range inside the document",
            ));
        }
        self.source.replace_range(range, replacement);
        Ok(())
    }

    pub fn source(&self) -> &str {
        &self.source
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retains_source_bytes() {
        let source = "\u{feff}# café\r\n\r\ntext  \r\n";
        assert_eq!(
            Document::new(source.into()).source().as_bytes(),
            source.as_bytes()
        );
    }

    #[test]
    #[cfg(not(target_arch = "wasm32"))]
    fn missing_file_is_an_error() {
        assert!(Document::read("/does-not-exist/mark.md").is_err());
    }
}
