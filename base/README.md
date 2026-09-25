# CSE 4095 project showcase

`base/` is a self-contained static website. Its home page is `index.html`, and the browser demos it links to are included in `base/demos/`. The assignment folders at the repository root contain the original projects.

## Open locally

Double-click `base/index.html` in File Explorer. Every project and demo link points to an HTML file, so the archive works through `file://` without Python, Node.js, or a local server.

If an original assignment demo changes, refresh its published copy from the repository root:

```sh
node base/build.mjs
```

The sync script uses only Node.js standard library modules. It adds the return-to-main-page button and the shared archive theme to each published demo. The charcoal-and-purple archive styles live in `base/assets/site.css`; the matching demo overrides live in `base/assets/demo-theme.css`, with the demo navigation in `base/assets/demo-return.css`. The original assignment files stay untouched. Commit the updated files in `base/demos/` along with the source change. Running the script is only needed when refreshing a demo, not when opening the archive.

## Run the tests

Install Node.js, then run these commands from the repository root:

```sh
python -m pip install -r base/requirements-dev.txt
python -m pylint --rcfile=base/.pylintrc base/tests
python -m pytest -q base
```

The pytest suite checks published HTML links, assets, navigation, and demo copy synchronization. It also runs the demos' JavaScript algorithms through Node.js, following the pattern used by the Assignment 5 tests. Pylint checks the Python tests.

Selenium opens every published page directly from its local HTML file in headless Chrome. It clicks through archive links and demo controls without a Python server. Install Chrome to run these browser tests locally. If Chrome cannot start, they skip locally; set `SELENIUM_REQUIRED=1` to make that a failure. GitHub Actions sets this flag, so a missing or broken browser fails the push or pull request check.

Opening the site still needs neither a server nor these test tools. The tests do not change the original assignment files.

## Cloudflare Pages Git settings

Connect this Git repository to a Cloudflare Pages project with these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Repository root (leave the advanced root directory field blank) |
| Framework preset | None |
| Build command | `exit 0` (or leave blank) |
| Build output directory | `base` |

Cloudflare publishes the committed contents of `base/` at the site root. The output directory must contain `index.html`. Keep every linked demo file inside `base/`, because sibling assignment folders are outside the published output.

## Add a future demo

1. Add the browser page to its `Assignment N/` source folder.
2. Add an `assignment-N` entry to the `demos` list in `build.mjs`, naming every HTML, CSS, JavaScript, image, or data file the browser requires. Use `index.html` as the destination for the main page when possible.
3. Run `node base/build.mjs` and commit the copied files in `base/demos/`.
4. Add a project page at `base/projects/assignment-N/index.html`, then add a card in `base/index.html` pointing to that page. Link directly to each `.html` file, including `index.html`; directory-only links do not reliably open locally.
5. Double-click `base/index.html` and check the links before pushing.

Python programs and notebooks cannot run directly in a static Pages site. For those assignments, add a browser-based demonstration or a static explanation page.
