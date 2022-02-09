import {unified} from "unified";
import {read, write} from "to-vfile";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeDocument from "rehype-document";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkWikiLink from "remark-wiki-link";
import remarkBreaks from "remark-breaks";
import remarkValidateLinks from "remark-validate-links";
import klaw from "klaw";
import path from "path";
import fs from "fs-extra";
import frontmatter from "front-matter";
import {reporter} from "vfile-reporter";
import {visit} from "unist-util-visit";

main();

async function main() {
  for await (const file of klaw("./notes")) {
    if (path.extname(file.path) === ".md") {
      const sourceVFile = await read(file.path);
      const htmlVFile = await compile(sourceVFile);

      htmlVFile.dirname = notesToOutPath(sourceVFile.dirname);
      htmlVFile.extname = ".html";
      htmlVFile.stem = pageResolver(sourceVFile.stem);

      await fs.mkdir(htmlVFile.dirname, {recursive: true});
      await write(htmlVFile);
    } else {
      if (!file.stats.isDirectory() && !file.path.includes(".obsidian")) {
        await copy(file.path, notesToOutPath(file.path));
      }
    }
  }

  await copy("node_modules/katex/dist/katex.min.css", "out/katex.min.css");
  await copy("node_modules/katex/dist/fonts", "out/fonts");
  await copy(
    "node_modules/highlight.js/styles/default.css",
    "out/highlight.css"
  );

  // A general solution would be to check for index.js, then pass it the content from index.md
  // this is quicker though.
  const indexHTML = (await import("./notes/index.js")).html;
  await fs.writeFile("out/index.html", indexHTML);
}

async function compile(file) {
  const fm = frontmatter(file.value.toString());
  file.value = fm.body;

  // Relative path to root, needed to handle the root being user.github.io/project
  const depth = file.path.split("/").reverse().lastIndexOf("notes") - 1;
  const root = "../".repeat(depth);

  return await unified()
    .use(remarkParse)
    .use(remarkWikiLink, {
      // This pkg is yucky, the defaults are wierd. it's only ~30 lines though, the parsing
      // code is done here: https://github.com/landakram/micromark-extension-wiki-link
      aliasDivider: "|",
      pageResolver: (name) => [pageResolver(name)],
      hrefTemplate: (permalink) => root + permalink,
    })
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkNoInlineDoubleDollar)
    .use(remarkValidateLinks)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeKatex)
    .use(rehypeDocument, {
      title: fm.attributes.title || file.stem,
      // Could fetch @latest css, but I'm afraid of breaking changes (eg. class name changes)
      css: [
        root + "styles.css",
        root + "highlight.css",
        root + "katex.min.css",
      ],
    })
    .use(rehypeStringify)
    .process(file)
    .then((file) => {
      process.stderr.write(reporter(file, {quiet: true}))
      return file
    })
}

function remarkNoInlineDoubleDollar() {

  return (tree, file) => {
    visit(tree, 'inlineMath', (node) => {
      const start = node.position.start.offset
      const end = node.position.end.offset
      const lexeme = file.value.slice(start, end)

      if (lexeme.startsWith("$$")) {
        file.message(
          "$$math$$ renders inline in remark-math but display in obsidian. Did you forget newlines?",
          node,
        )
      }
    })
  }
}

// convert "Hello World.md" -> hello-world.md
const pageResolver = (name) => name.toLowerCase().replace(/ /g, "-");

// convert a/b/notes/c/d -> a/b/out/c/d
const notesToOutPath = (p) => path.join("out", path.relative("notes", p));

async function copy(src, dst) {
  await fs.copy(src, dst);
}
