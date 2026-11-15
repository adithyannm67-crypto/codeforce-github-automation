# codeforce-github-automation

Automatically saves your Codeforces problems and submitted solutions to a GitHub repository. A Chrome extension collects the problem statement and your submission, then sends them to a local backend that commits them to GitHub.

The generated solutions live in [codeforce_solutions](https://github.com/adithyannm67-crypto/codeforce_solutions).

## Components

| Path | Purpose |
|---|---|
| `extension/` | Chrome extension (Manifest V3, "Codeforces GitHub Sync", v2.0.0) that reads Codeforces pages |
| `extension/problemContent.js` | Runs on problem pages (`codeforces.com/problemset/problem/*`) and captures the title, statement, problem code and URL |
| `extension/content.js` | Runs on all Codeforces pages and listens for the submit form, capturing the problem code, language ID and source code |
| `extension/service-worker.js` | Holds the captured problem and submission until both arrive, checks that they match, then posts them to the backend |
| `backend/` | Git submodule for the local server that receives submissions and writes them to GitHub. It is recorded at commit `9a08323` but its contents aren't included in this repository |

## How it works

1. **Open a problem.** `problemContent.js` reads the problem statement and sends it to the service worker as `PROBLEM_DATA`.
2. **Submit a solution.** `content.js` reads the submitted code and language from the submit form and sends it as `SUBMISSION_DATA`.
3. **Pair the two.** The service worker stores each message in `chrome.storage.local` and waits until both are present. It then checks that the problem codes match (case-insensitive) and skips the pair if they don't.
4. **Send to the backend.** The service worker sends both to `POST http://localhost:5000/api/submissions` as JSON with `problem` and `submission` fields.
5. **Clean up.** After the backend responds successfully, the temporary data is removed from storage. If the backend returns an error, the data stays stored.

## Setup

### 1. Start the backend

The backend isn't in this repository's files, so clone it with its submodule:

```bash
git clone --recurse-submodules https://github.com/adithyannm67-crypto/codeforce-github-automation.git
cd codeforce-github-automation
```

If you already cloned without it:

```bash
git submodule update --init --recursive
```

Then start the backend so that it listens on port `5000`. The backend folder doesn't include startup instructions, so check its code for how it runs. Any secrets, such as a GitHub token, should go in a `.env` file. `.gitignore` excludes `.env` and `.env.*`, but keeps `.env.example`.

### 2. Load the extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `extension/` folder.
3. Keep the backend running while you submit solutions.

## Requirements

- Google Chrome (or another Chromium browser that supports Manifest V3)
- A backend running on `localhost:5000`
- Node.js, if the backend requires it

## Limitations

- The extension doesn't check the verdict, so a rejected submission is saved the same way as an accepted one.
- Data is only sent when both the problem page and the submit form have been read, so the problem must be opened before submitting.
- The backend must be running. If it isn't, the request fails and nothing is saved.
- Everything runs locally. Only the commit to GitHub leaves your machine, and it's done by the backend.

## Security

- Keep your GitHub token out of the repository and out of the extension. Store it in the backend's `.env` file.
- The extension requests access to `codeforces.com`, `api.github.com` and `localhost:5000`, and the `storage` permission.
