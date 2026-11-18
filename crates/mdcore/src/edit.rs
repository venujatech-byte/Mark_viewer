use std::ops::Range;

/// Find the smallest single replacement, with UTF-8 boundaries on both strings.
pub fn minimal_edit<'a>(before: &str, after: &'a str) -> (Range<usize>, &'a str) {
    let prefix = before
        .chars()
        .zip(after.chars())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum();
    let suffix: usize = before[prefix..]
        .chars()
        .rev()
        .zip(after[prefix..].chars().rev())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum();
    (
        prefix..before.len() - suffix,
        &after[prefix..after.len() - suffix],
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn minimal_edits_reconstruct_every_pair_of_unicode_inputs() {
        let cases = [
            "",
            "a",
            "aa",
            "🦀é\n",
            "🦀è\n",
            "# text\r\n",
            "prefix changed suffix",
            "prefix suffix",
        ];
        for before in cases {
            for after in cases {
                let (range, replacement) = minimal_edit(before, after);
                let mut actual = before.to_owned();
                actual.replace_range(range, replacement);
                assert_eq!(actual, after);
            }
        }
        assert_eq!(minimal_edit("a🦀z", "a界z"), (1..5, "界"));
    }
}
