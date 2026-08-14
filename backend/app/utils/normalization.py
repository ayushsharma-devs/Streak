import unicodedata


def normalize_text(text: str) -> str:
    """
    Normalizes a text string by:
    1. Applying Unicode NFKC normalization (compatibility decomposition + canonical composition)
    2. Stripping leading and trailing whitespace
    3. Applying casefold for aggressive caseless matching

    Does NOT apply fuzzy matching.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKC", text)
    return normalized.strip().casefold()
