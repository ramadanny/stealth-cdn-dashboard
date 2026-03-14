import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.admin_session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session" });
  }
};

app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (password && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }
  res.status(401).json({ error: "Incorrect password" });
});

app.post("/api/auth/logout", (_, res) => {
  res.clearCookie("admin_session");
  res.json({ success: true });
});

app.get("/api/auth/check", (req, res) => {
  const token = req.cookies.admin_session;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    res.json({ authenticated: true });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

const getOctokit = () => new Octokit({ auth: process.env.GITHUB_TOKEN });

const generateUniqueName = (originalName: string) => {
  const ext = path.extname(originalName);
  const randomString = Math.random().toString(36).substring(2, 10) + 
                       Math.random().toString(36).substring(2, 10);
  return `${randomString}${ext}`;
};

app.get("/api/files", authenticate, async (_, res) => {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    return res.status(500).json({ error: "GitHub configuration missing" });
  }
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "",
      ref: process.env.GITHUB_BRANCH || "main",
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
          cdn_url: `https://cdn.jsdelivr.net/gh/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}@${process.env.GITHUB_BRANCH || "main"}/${item.path}`,
        }));
      res.json(files);
    } else {
      res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/upload", authenticate, async (req, res) => {
  const { name, content, message } = req.body;
  try {
    const octokit = getOctokit();
    const uniqueName = generateUniqueName(name);
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: uniqueName,
      message: message || `Upload ${uniqueName}`,
      content,
      branch: process.env.GITHUB_BRANCH || "main",
    });
    res.json({ success: true, fileName: uniqueName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/files/:path", authenticate, async (req, res) => {
  const { sha } = req.query;
  const { path: routePath } = req.params;
  try {
    const octokit = getOctokit();
    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: routePath,
      message: `Delete ${routePath}`,
      sha: sha as string,
      branch: process.env.GITHUB_BRANCH || "main",
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/files/:path/rename", authenticate, async (req, res) => {
  const oldPath = req.params.path;
  const { newPath, sha } = req.body;
  try {
    const octokit = getOctokit();
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: oldPath,
      ref: process.env.GITHUB_BRANCH || "main",
    });

    if ("content" in fileData) {
      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: newPath,
        message: `Rename ${oldPath} to ${newPath}`,
        content: fileData.content,
        branch: process.env.GITHUB_BRANCH || "main",
      });

      await octokit.repos.deleteFile({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: oldPath,
        message: `Cleanup after rename`,
        sha,
        branch: process.env.GITHUB_BRANCH || "main",
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Could not get file content" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

if (!process.env.VERCEL) {
  (async () => {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
}

export default app;