use std::{fs, io, path::Path};

/// A UTF-8 markdown source. Rendering never mutates this text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Document {
    source: String,
}

impl Document {
    pub fn new(source: String) -> Self {
        Self { source }
    }

    pub fn read(path: impl AsRef<Path>) -> io::Result<Self> {
        fs::read_to_string(path).map(Self::new)
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
    fn missing_file_is_an_error() {
        assert!(Document::read("/does-not-exist/mark.md").is_err());
    }
}
