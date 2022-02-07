import glob from "glob";
import path from "path";

const completedListHTML = glob
  .sync("notes/*/*.md")
  .map((p) => path.relative("notes", p.replace(/\.md$/, "")))
  .filter((p) => p.match(/\d\w\/\d+/))
  .map((p) => `<li><a href=\"${p}\">${p}</a></li>`)
  .join("\n");

export const html = String.raw`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Index</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="highlight.css">
<link rel="stylesheet" href="katex.min.css">
</head>
<body>
<p>These are my solutions to axler's linear algebra done right, to view a specific solution go to <code>/section/number</code>, eg. to view my solution to exercise <code>1</code> in section <code>2.A</code> go to <code>/2a/1</code>.</p>
<ul class="column-count">
${completedListHTML}
</ul>
</body>
</html>
`;
