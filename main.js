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
import retextSpell from "retext-spell";
import remarkRetext from "remark-retext";
import retextEnglish from "retext-english";
import dictionary from "dictionary-en-gb";
import klaw from "klaw";
import path from "path";
import fs from "fs-extra";
import frontmatter from "front-matter";
import {reporter} from "vfile-reporter";
import {visit} from "unist-util-visit";
import {VFile} from 'vfile';

main();

async function main() {
  for await (const file of klaw("./notes")) {
    const ext = path.extname(file.path)
    if (ext === ".md") {
      const markdownVFile = await read(file.path);
      await compileAndWrite(markdownVFile);
    } else if (ext === ".js") {
      // NOTE: The smartest possible thing would be to run js code blocks in
      // notes if they're annotated with "// :run:", this is a bit complicated
      // to add, but is the nicest way to do this without leaving obsidian.
      const markdown = (await import(file.path)).markdown;
      const markdownVFile = new VFile({path: file.path, value: markdown});
      await compileAndWrite(markdownVFile);
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
}

async function compile(file) {
  const fm = frontmatter(file.value.toString());
  file.value = fm.body;

  // Relative path to root, needed to handle the root being user.github.io/project
  const depth = file.path.split("/").reverse().lastIndexOf("notes") - 1;
  const root = "../".repeat(depth);

  const solutionRegex = /(\d\w)\/(\d\d?)\.md/
  const relativePath = path.relative("notes", file.path)
  const meta = {
    description: solutionRegex.test(relativePath)
      ? relativePath.replace(solutionRegex, "Solution $1 $2 to Axler's Linear Algebra Done Right")
      : "Solutions to Axler's Linear Algebra Done Right"
  }
  const title = fm.attributes.title || (
    solutionRegex.test(relativePath)
      ? relativePath.replace(solutionRegex, "Solution $1 $2")
      : file.stem
  )

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
    // uncomment if you want to spellcheck
    // .use(remarkRetext, unified().use(retextEnglish).use(retextSpell, dictionary))
    .use(remarkRehype, {allowDangerousHtml: true})
    .use(rehypeHighlight)
    .use(rehypeKatex)
    .use(rehypeDocument, {
      title: title,
      meta: meta,

      // Could fetch @latest css, but I'm afraid of breaking changes (eg. class name changes)
      css: [
        root + "styles.css",
        root + "highlight.css",
        root + "katex.min.css",
      ],

      // TODO: Use a rehype-head plugin or something to add this
      // <script async defer data-domain="ulissemini.github.io" src="https://a.nerdsniper.net/a.js"></script>
    })
    .use(rehypeStringify, {allowDangerousHtml: true})
    .process(file)
    .then((file) => {
      process.stderr.write(reporter(file, {quiet: true}))
      return file
    })
}

async function compileAndWrite(markdownVFile) {
  const htmlVFile = await compile(markdownVFile)
  htmlVFile.dirname = notesToOutPath(markdownVFile.dirname);
  htmlVFile.extname = ".html";
  htmlVFile.stem = pageResolver(markdownVFile.stem);

  await fs.mkdir(htmlVFile.dirname, {recursive: true});
  await write(htmlVFile);
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
