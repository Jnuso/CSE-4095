import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(siteDirectory, '..');
const archiveStylesheet = '<link rel="stylesheet" href="../../assets/demo-return.css">';
const archiveReturn = '<nav class="cse4095-return-bar" aria-label="Archive navigation"><a href="../../index.html">&#8592; Back to main page</a></nav>';

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

    // Give each published demo a path back to the archive without changing
    // the original assignment files. Rebuilding starts with a fresh copy.
    if (destination.endsWith('.html')) {
      const html = await readFile(destinationPath, 'utf8');
      if (!/<\/head>/i.test(html) || !/<body\b[^>]*>/i.test(html)) {
        throw new Error(`Cannot add archive navigation to ${source}`);
      }
      const lineBreak = html.includes('\r\n') ? '\r\n' : '\n';
      const withStylesheet = html.replace(/<\/head>/i, `  ${archiveStylesheet}${lineBreak}</head>`);
      const withReturn = withStylesheet.replace(
        /<body\b[^>]*>/i,
        (bodyTag) => `${bodyTag}${lineBreak}  ${archiveReturn}`,
      );
      await writeFile(destinationPath, withReturn, 'utf8');
    }
  }

  console.log(`Copied ${demo.directory}`);
}
