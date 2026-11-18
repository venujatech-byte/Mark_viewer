use mdcore::{Document, render};
use std::{
    env,
    error::Error,
    io::{self, Write},
};

fn main() -> Result<(), Box<dyn Error>> {
    let path = env::args_os()
        .nth(1)
        .ok_or("usage: cargo run -p mdcore --example render -- FILE.md")?;
    let document = Document::read(path)?;
    io::stdout().write_all(render(document.source()).as_bytes())?;
    Ok(())
}
