export function sanitizeHtmlSnippet(raw: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;

  // Remove script and style tags
  tmp.querySelectorAll("script,style").forEach((n) => n.remove());

  // Remove dangerous attributes
  const all = tmp.querySelectorAll("*");
  all.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      // Remove event handlers
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
      // Remove javascript: URLs
      if (
        (attr.name === "href" || attr.name === "src") &&
        attr.value.startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return tmp.innerHTML;
}

export function escapeHtml(str: string): string {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[s] || s)
  );
}

export function escapeHtmlAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
