import glob from "glob";
import path from "path";

const completedListHTML = glob
  .sync("notes/*/*.md")
  .map((p) => path.relative("notes", p.replace(/\.md$/, "")))
  .filter((p) => p.match(/\d\w\/\d+/))
  .map((p) => `<li><a href="${p}">${p}</a></li>`)
  .join("\n");

export const markdown = `
---
title: "Linear Algebra Done Right Solutions"
---

# Linear Algebra Done Right Solutions

These are my solutions to axler's linear algebra done right, to view a specific solution go to \`/section/number\`, eg. to view my solution to exercise \`1\` in section \`2.A\` go to \`/2a/1\`.

<ul class="column-count">
${completedListHTML}
</ul>
`.trim();
