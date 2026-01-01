---
title: Markdown Formatting Guide
kind: article
date: 2025-12-30
tags: [markdown, guide, reference]
summary: A comprehensive reference for all the markdown formatting supported on this site.
publish: true
---

# Markdown Formatting Guide

This post demonstrates all the markdown formatting supported on this site. Use it as a reference when writing your own posts.

## Text Formatting

Basic text formatting options:

- **Bold text** using `**double asterisks**`
- *Italic text* using `*single asterisks*`
- ***Bold and italic*** using `***triple asterisks***`
- `Inline code` using backticks

You can also use underscores: _italic_ and __bold__.

## Headings

Headings use hash symbols and get red hash styling:

```markdown
# Heading 1
## Heading 2
### Heading 3
```

Each heading automatically gets an ID for linking.

## Lists

### Unordered Lists

- First item
- Second item
- Third item with a longer description that might wrap to multiple lines

### Ordered Lists

1. First step
2. Second step
3. Third step

## Blockquotes

> This is a blockquote. Use it for highlighting important quotes or callouts.
>
> It can span multiple paragraphs.

## Code Blocks

Inline code: `const x = 42;`

Fenced code blocks with syntax highlighting:

```javascript
// JavaScript example
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```

```python
# Python example
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

```css
/* CSS example */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

## Tables

Tables are great for structured data:

| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | ✅ Done | Toggle in header |
| RSS feed | 🚧 Planned | Coming soon |
| Comments | ❌ No plans | Use social media |

Alignment options:

| Left | Centre | Right |
|:-----|:------:|------:|
| Text | Text | Text |
| More | More | More |

## Links

- [External link](https://example.com)
- [Link with title](https://example.com "Example Site")

## Horizontal Rules

Use three dashes for a horizontal rule:

---

Or three asterisks:

***

## Images

Images use the standard markdown syntax:

```markdown
![Alt text](path/to/image.jpg)
```

## Combining Elements

You can combine elements for rich formatting:

> **Note:** This is an important callout that combines:
> - Bold text
> - A list
> - And a blockquote

### Example: API Response

Here's a typical API response:

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "name": "Example",
    "tags": ["one", "two", "three"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| status | string | Response status |
| data | object | Response payload |
| data.id | number | Unique identifier |

## Best Practices

1. **Use headings hierarchically** - Don't skip levels
2. **Keep paragraphs short** - Easier to read
3. **Use lists for multiple items** - Better than comma-separated
4. **Add alt text to images** - Accessibility matters
5. **Preview before publishing** - Catch formatting issues

---

*This guide covers the most common markdown features. Happy writing!*
