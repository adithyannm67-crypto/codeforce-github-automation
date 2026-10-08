import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  console.log(req.method, req.url);

  if (req.method === "POST" && req.url === "/api/submission") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const submission = JSON.parse(body);

        console.log("Received submission:");
        console.log(submission);

        handleSubmission(submission);

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });

        res.end(
          JSON.stringify({
            success: true,
            message: "Submission received",
          }),
        );
      } catch (error) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            error: "Invalid JSON",
          }),
        );
      }
    });

    return;
  } else if (req.method === "GET" && req.url === "/") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        message: "Backend is running",
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end(
    JSON.stringify({
      message: "Route not found",
    }),
  );
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const extensions = {
  43: ".c",

  54: ".cpp",
  89: ".cpp",
  91: ".cpp",
  45: ".cpp",

  65: ".cs",
  79: ".cs",
  96: ".cs",
  9: ".cs",

  28: ".d",
  97: ".fs",
  32: ".go",
  12: ".hs",

  87: ".java",
  36: ".java",
  46: ".java",

  83: ".kt",
  88: ".kt",
  99: ".kt",

  19: ".ml",

  3: ".pas",
  4: ".pas",
  51: ".pas",

  13: ".pl",

  6: ".php",

  7: ".py",
  31: ".py",
  40: ".py",
  41: ".py",
  70: ".py",

  67: ".rb",

  75: ".rs",
  98: ".rs",

  20: ".scala",

  34: ".js",
  55: ".js",

  14: ".tcl",
};

function handleSubmission(message) {
  if (!message.problem) {
    console.error("❌ Problem data not found");
    return;
  }

  const match = message.problem.toString().match(/^(\d+)([A-Z]\d*)$/);

  if (!match) {
    throw new Error(`❌ Invalid problem code: ${problemCode}`);
  }

  const contestId = Number(match[1]);
  const index = match[2];

  uploadToGitHub({ ...message, contestId, index });
}
async function uploadToGitHub({
  problem,
  languageId,
  source,
  contestId,
  index,
}) {
  console.log("🚀 Uploading to GitHub...");

  const extension = extensions[languageId] || "txt";
  const filePath = `${contestId}-${index}/solution.${extension}`;

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${filePath}`;

  const content = btoa(unescape(encodeURIComponent(source)));

  try {
    // Check if the file already exists
    const checkResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    let sha = null;

    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();

      sha = existingFile.sha;

      console.log("📄 File already exists");
      console.log("SHA:", sha);
    } else if (checkResponse.status === 404) {
      console.log("📄 File doesn't exist. Creating it...");
    } else {
      const error = await checkResponse.json();
      console.error("❌ Error checking file:", error);
      return;
    }

    // Upload / update
    const body = {
      message: `${sha ? "Update" : "Add"} Codeforces ${problem} solution`,
      content,
    };

    // IMPORTANT:
    // SHA is required only when updating an existing file
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("GitHub status:", response.status);
    console.log("GitHub response:", data);

    if (!response.ok) {
      console.error("❌ GitHub upload failed:", data);
      return;
    }

    console.log("✅ Successfully uploaded:", data.content.html_url);

  } catch (error) {
    console.error("❌ GitHub request failed:", error);
  }
}