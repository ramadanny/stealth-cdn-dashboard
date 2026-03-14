import { Router } from "express";
import jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";
import path from "path";
import { config } from "../config/env";

const router = Router();
const octokit = new Octokit({ auth: config.GITHUB_TOKEN });

const generateUniqueName = (originalName: string) => {
  const ext = path.extname(originalName);
  const randomString = Math.random().toString(36).substring(2, 10) + 
                       Math.random().toString(36).substring(2, 10);
  return `${randomString}${ext}`;
};

const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    jwt.verify(token, config.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session" });
  }
};

router.post("/auth/login", (req, res) => {
  const { password } = req.body;
  if (password === config.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, config.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }
  res.status(401).json({ error: "Incorrect password" });
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("admin_session");
  res.json({ success: true });
});

router.get("/auth/check", (req, res) => {
  const token = req.cookies.admin_session;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, config.JWT_SECRET);
    res.json({ authenticated: true });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

router.get("/files", authenticate, async (req, res) => {
  if (!config.GITHUB_TOKEN || !config.GITHUB_OWNER || !config.GITHUB_REPO) {
    return res.status(500).json({ error: "GitHub configuration missing" });
  }
  try {
    const { data } = await octokit.repos.getContent({
      owner: config.GITHUB_OWNER,
      repo: config.GITHUB_REPO,
      path: "",
      ref: config.GITHUB_BRANCH,
    });

    if (Array.isArray(data)) {
      const files = data
        .filter((item) => item.type === "file")
        .map((item) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          download_url: item.download_url,
          cdn_url: `https://cdn.jsdelivr.net/gh/${config.GITHUB_OWNER}/${config.GITHUB_REPO}@${config.GITHUB_BRANCH}/${item.path}`,
        }));
      res.json(files);
    } else {
      res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/upload", authenticate, async (req, res) => {
  const { name, content, message } = req.body;
  try {
    const uniqueName = generateUniqueName(name);
    await octokit.repos.createOrUpdateFileContents({
      owner: config.GITHUB_OWNER!,
      repo: config.GITHUB_REPO!,
      path: uniqueName,
      message: message || `Upload ${uniqueName} (original: ${name})`,
      content: content,
      branch: config.GITHUB_BRANCH,
    });
    res.json({ success: true, fileName: uniqueName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/files/:path", authenticate, async (req, res) => {
  const { sha } = req.query;
  const path = req.params.path;
  try {
    await octokit.repos.deleteFile({
      owner: config.GITHUB_OWNER!,
      repo: config.GITHUB_REPO!,
      path,
      message: `Delete ${path}`,
      sha: sha as string,
      branch: config.GITHUB_BRANCH,
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/files/:path/rename", authenticate, async (req, res) => {
  const oldPath = req.params.path;
  const { newPath, sha } = req.body;
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: config.GITHUB_OWNER!,
      repo: config.GITHUB_REPO!,
      path: oldPath,
      ref: config.GITHUB_BRANCH,
    });

    if ("content" in fileData) {
      await octokit.repos.createOrUpdateFileContents({
        owner: config.GITHUB_OWNER!,
        repo: config.GITHUB_REPO!,
        path: newPath,
        message: `Rename ${oldPath} to ${newPath}`,
        content: fileData.content,
        branch: config.GITHUB_BRANCH,
      });

      await octokit.repos.deleteFile({
        owner: config.GITHUB_OWNER!,
        repo: config.GITHUB_REPO!,
        path: oldPath,
        message: `Cleanup after rename to ${newPath}`,
        sha: sha,
        branch: config.GITHUB_BRANCH,
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Could not get file content" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;