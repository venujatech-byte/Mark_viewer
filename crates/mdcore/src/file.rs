use crate::Document;
use std::{
    fs,
    io::{self, Write},
    path::{Path, PathBuf},
};

/// A file and its last-read bytes, used to detect external save conflicts.
#[derive(Debug)]
pub struct FileDocument {
    path: PathBuf,
    saved: String,
    pub document: Document,
}

impl FileDocument {
    pub fn open(path: impl AsRef<Path>) -> io::Result<Self> {
        let path = fs::canonicalize(path)?;
        if !fs::metadata(&path)?.is_file() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "expected a regular file",
            ));
        }
        let document = Document::read(&path)?;
        Ok(Self {
            saved: document.source().into(),
            document,
            path,
        })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Atomically replace the file after verifying its last-read bytes.
    pub fn save(&mut self) -> io::Result<()> {
        let metadata = self.check_unchanged()?;
        if self.document.source() == self.saved {
            return Ok(());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            if metadata.nlink() > 1 {
                return Err(io::Error::new(
                    io::ErrorKind::Unsupported,
                    "atomic save would break hard links; edit an independent copy",
                ));
            }
        }
        if metadata.permissions().readonly() {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "file is read-only",
            ));
        }
        let parent = self
            .path
            .parent()
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "file has no parent"))?;
        let mut temporary = tempfile::NamedTempFile::new_in(parent)?;
        temporary.write_all(self.document.source().as_bytes())?;
        temporary
            .as_file()
            .set_permissions(metadata.permissions())?;
        temporary.as_file().sync_all()?;
        self.check_unchanged()?;
        // shortcut: other programs can write after this check, add cooperative locking if needed.
        temporary.persist(&self.path).map_err(|error| error.error)?;
        self.saved = self.document.source().into();
        #[cfg(unix)]
        fs::File::open(parent)?.sync_all()?;
        Ok(())
    }

    fn check_unchanged(&self) -> io::Result<fs::Metadata> {
        let metadata = fs::symlink_metadata(&self.path)?;
        if !metadata.is_file() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "file was replaced with a non-regular file",
            ));
        }

        if fs::read(&self.path)? != self.saved.as_bytes() {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "file changed on disk; reopen it or copy your edits before saving",
            ));
        }
        Ok(metadata)
    }
}
