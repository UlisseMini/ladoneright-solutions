import glob from "glob";
import path from "path";
import fs from "fs-extra";

// TODO: make async
const files = glob.sync("notes/*/*.md");

const classes = await Promise.all(
  files.map(async (file) =>
    /todo/i.test(await fs.readFile(file)) ? "todo" : "not-todo"
  )
);

const completedListHTML = files
  .map((p) => path.relative("notes", p.replace(/\.md$/, "")))
  .filter((p) => p.match(/\d\w\/\d+/))
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
