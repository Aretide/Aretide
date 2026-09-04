"""Minimal rich-text sanitizing: Gmail-lite formatting only, nothing else.

Campaign step bodies come from a contenteditable paragraph editor in the
dashboard. This is the server-side boundary: only a small whitelist of tags
survives (bold/italic/underline/strikethrough, bullet/numbered lists, and a
link with a validated href), everything else is dropped and all text is
escaped. No attributes survive except a validated `href` on `<a>`.
"""

from __future__ import annotations

from html import escape as html_escape
from html.parser import HTMLParser
from urllib.parse import urlsplit

ALLOWED_INLINE_TAGS = frozenset({"b", "strong", "i", "em", "u", "s", "strike"})
ALLOWED_LIST_TAGS = frozenset({"ul", "ol", "li"})
VOID_TAGS = frozenset({"br"})
ALLOWED_LINK_SCHEMES = frozenset({"http", "https", "mailto"})


def validate_url(url: str) -> str | None:
    """Return `url` if its scheme is http/https/mailto, else None."""
    if not url:
        return None
    scheme = urlsplit(url).scheme.lower()
    if scheme and scheme not in ALLOWED_LINK_SCHEMES:
        return None
    return url


def _safe_href(attrs: list[tuple[str, str | None]]) -> str | None:
    href = None
    for name, value in attrs:
        if name == "href" and value:
            href = value
            break
    if not href:
        return None
    return validate_url(href)


class _InlineSanitizer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self._stack: list[str | None] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in VOID_TAGS:
            self.out.append("<br>")
            return
        if tag in ALLOWED_INLINE_TAGS or tag in ALLOWED_LIST_TAGS:
            self.out.append(f"<{tag}>")
            self._stack.append(tag)
            return
        if tag == "a":
            href = _safe_href(attrs)
            if href:
                self.out.append(f'<a href="{html_escape(href, quote=True)}">')
                self._stack.append("a")
            else:
                self._stack.append(None)
            return
        self._stack.append(None)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in VOID_TAGS:
            self.out.append("<br>")
            return
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if tag in VOID_TAGS or not self._stack:
            return
        opened = self._stack.pop()
        if opened:
            self.out.append(f"</{opened}>")

    def handle_data(self, data: str) -> None:
        self.out.append(html_escape(data))

    def handle_entityref(self, name: str) -> None:
        self.out.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.out.append(f"&#{name};")


def sanitize_inline_html(raw: str) -> str:
    """Keep only whitelisted tags (with a validated href on links); escape the rest."""
    parser = _InlineSanitizer()
    parser.feed(raw or "")
    parser.close()
    return "".join(parser.out).strip()


class _TagStripper(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self._href_stack: list[str | None] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "br":
            self.out.append("\n")
            return
        if tag == "li":
            self.out.append("- ")
            return
        if tag == "a":
            self._href_stack.append(_safe_href(attrs))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "br":
            self.out.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href_stack:
            href = self._href_stack.pop()
            if href:
                self.out.append(f" ({href})")
        elif tag == "li":
            self.out.append("\n")

    def handle_data(self, data: str) -> None:
        self.out.append(data)


def strip_tags(raw: str) -> str:
    """Drop all tags, keeping text (used for the plain-text email part)."""
    parser = _TagStripper()
    parser.feed(raw or "")
    parser.close()
    return "".join(parser.out)


def strip_all_tags(raw: str) -> str:
    """Strip every tag and return plain text with no line breaks (for subjects)."""
    return " ".join(strip_tags(raw).split())
