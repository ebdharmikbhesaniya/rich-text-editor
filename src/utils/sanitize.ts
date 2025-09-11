export const sanitizeHtmlSnippet = (raw: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;

  // Remove dangerous elements
  tmp.querySelectorAll("script,style").forEach((n) => n.remove());

  // Remove event handlers and dangerous attributes
  const all = tmp.querySelectorAll("*");
  all.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
      if (
        (attr.name === "href" || attr.name === "src") &&
        attr.value.startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return tmp.innerHTML;
};
