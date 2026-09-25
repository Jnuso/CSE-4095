import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(siteDirectory, '..');
const archiveStylesheet = '<link rel="stylesheet" href="../../assets/demo-return.css">';
const themeStylesheet = '<link rel="stylesheet" href="../../assets/demo-theme.css">';
const faviconLink = '<link rel="icon" type="image/svg+xml" sizes="any" href="../../assets/favicon.svg">';
const themeColor = '#0d0d0f';
const archiveReturn = '<nav class="cse4095-return-bar" aria-label="Archive navigation"><span class="cse4095-return-mark" aria-hidden="true">C/9</span><a href="../../index.html">&#8592; Back to main page</a><span class="cse4095-return-label">CSE 4095 / PROJECT DEMO</span></nav>';

// Only copy files that a browser needs to run each demo. The original
// assignment folders remain the source of truth.
const demos = [
  {
    directory: 'assignment-1',
    files: [
      ['Assignment 1/index.html', 'index.html'],
      ['Assignment 1/styles.css', 'styles.css'],
      ['Assignment 1/script.js', 'script.js'],
    ],
  },
  {
    directory: 'assignment-2',
    files: [
      ['Assignment 2/two_stack_expression_visualizer_unary.html', 'index.html'],
    ],
  },
  {
    directory: 'assignment-4',
    files: [
      ['Assignment 4/card24.html', 'index.html'],
    ],
  },
  {
    directory: 'assignment-5',
    files: [
      ['Assignment 5/astar.html', 'astar.html'],
      ['Assignment 5/bfs.html', 'bfs.html'],
    ],
  },
  {
    directory: 'assignment-6',
    files: [
      ['Assignment 6/index.html', 'index.html'],
      ['Assignment 6/style.css', 'style.css'],
      ['Assignment 6/game.js', 'game.js'],
      ['Assignment 6/ai.js', 'ai.js'],
      ['Assignment 6/app.js', 'app.js'],
      ['Assignment 6/favicon.svg', 'favicon.svg'],
    ],
  },
];

for (const demo of demos) {
  const destinationDirectory = join(siteDirectory, 'demos', demo.directory);
  await mkdir(destinationDirectory, { recursive: true });

  for (const [source, destination] of demo.files) {
    const destinationPath = join(destinationDirectory, destination);
    await copyFile(
      join(repositoryDirectory, source),
      destinationPath,
    );

    // Style each published demo and give it a path back to the archive without
    // changing the original assignment files. Rebuilding starts with a fresh copy.
    if (destination.endsWith('.html')) {
      const html = await readFile(destinationPath, 'utf8');
      if (!/<html\b[^>]*>/i.test(html) || !/<\/head>/i.test(html) || !/<body\b[^>]*>/i.test(html)) {
        throw new Error(`Cannot add archive theme and navigation to ${source}`);
      }
      const lineBreak = html.includes('\r\n') ? '\r\n' : '\n';
      const view = destination.slice(0, -'.html'.length);
      const withMarker = html.replace(
        /<html\b[^>]*>/i,
        (htmlTag) => `${htmlTag.slice(0, -1)} data-cse4095-demo="${demo.directory}" data-cse4095-view="${view}">`,
      );
      let withThemeColor;
      if (/<meta\s+name="theme-color"\s+content="[^"]+"\s*\/?>/i.test(withMarker)) {
        withThemeColor = withMarker.replace(
          /(<meta\s+name="theme-color"\s+content=")[^"]+("\s*\/?>)/i,
          (_match, start, end) => `${start}${themeColor}${end}`,
        );
      } else if (/<meta\s+charset="[^"]+"\s*\/?>/i.test(withMarker)) {
        withThemeColor = withMarker.replace(
          /<meta\s+charset="[^"]+"\s*\/?>/i,
          (charsetTag) => `${charsetTag}${lineBreak}  <meta name="theme-color" content="${themeColor}">`,
        );
      } else {
        withThemeColor = withMarker.replace(
          /<head\b[^>]*>/i,
          (headTag) => `${headTag}${lineBreak}  <meta name="theme-color" content="${themeColor}">`,
        );
      }
      const withStylesheet = withThemeColor.replace(
        /<\/head>/i,
        `  ${archiveStylesheet}${lineBreak}  ${themeStylesheet}${lineBreak}  ${faviconLink}${lineBreak}</head>`,
      );
      const withReturn = withStylesheet.replace(
        /<body\b[^>]*>/i,
        (bodyTag) => `${bodyTag}${lineBreak}  ${archiveReturn}`,
      );
      await writeFile(destinationPath, withReturn, 'utf8');
    }
  }

  console.log(`Copied ${demo.directory}`);
}
