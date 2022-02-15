import glob from "glob";
import path from "path";
import fs from "fs-extra";

// convert 3b/12 -> 3000 + 200 + 12 for sorting
const f = (x) =>
  parseInt(x[0]) * 1000 +
  (x.charCodeAt(1) - "a".charCodeAt(0)) * 100 +
  parseInt(x.slice(3));

// TODO: make async
const files = glob
  .sync("notes/*/*.md")
  .map((p) => path.relative("notes", p))
  .filter((p) => p.match(/\d\w\/\d+\.md$/))
  .sort((a, b) => f(a) - f(b));

const classes = await Promise.all(
  files.map(async (file) =>
    /todo/i.test(await fs.readFile(path.join("notes", file)))
      ? "todo"
      : "not-todo"
  )
);

const completedListHTML = files
  .map((p) => p.replace(/\.md$/, ""))
  .map((p, i) => `<li class=\"${classes[i]}\"><a href=\"${p}\">${p}</a></li>`)
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
