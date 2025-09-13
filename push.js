const { Octokit } = require("@octokit/rest");
const fs = require("fs").promises;
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function pushFile(path, content) {
  const [owner, repo] = process.env.GITHUB_REPO.replace(/\/$/, "").split("/");
  const branch = process.env.GITHUB_BRANCH || "main";

  // Get the SHA if file already exists
  let sha = undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    sha = data.sha;
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  // Push the new file content
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `Update ${path}`,
    content: Buffer.from(content).toString("base64"),
    branch,
    sha,
    committer: {
      name: process.env.GITHUB_USERNAME,
      email: process.env.GITHUB_EMAIL,
    },
    author: {
      name: process.env.GITHUB_USERNAME,
      email: process.env.GITHUB_EMAIL,
    },
  });

  console.log(`✅ Pushed ${path} to GitHub`);
}

module.exports = async function pushAllToGitHub() {
  try {
    const data1 = await fs.readFile("./redeemed.json", "utf-8");
    const data2 = await fs.readFile("./blacklist.json", "utf-8");
    const data3 = await fs.readFile("./codes.json", "utf-8");

    await pushFile(process.env.GITHUB_PATH1, data1);
    await pushFile(process.env.GITHUB_PATH2, data2);
    await pushFile(process.env.GITHUB_PATH3, data3);
  } catch (err) {
    console.error("❌ Failed to push files:", err);
  }
};

