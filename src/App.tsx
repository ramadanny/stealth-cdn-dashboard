import React, { useState, useEffect, useMemo } from "react";
import { 
  Upload, 
  Search, 
  Grid, 
  List as ListIcon, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Edit3, 
  ExternalLink,
  LogOut,
  Check,
  Loader2,
  FileText,
  Image as ImageIcon,
  File as FileIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) return <ImageIcon className="w-5 h-5" />;
  if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return <FileText className="w-5 h-5" />;
  return <FileIcon className="w-5 h-5" />;
};

const isImage = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "");
};

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-zinc-900 text-white hover:bg-zinc-800",
      secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
      danger: "bg-red-50 text-red-600 hover:bg-red-100",
      ghost: "hover:bg-zinc-100 text-zinc-600"
    };
    return (
      <button
        ref={ref}
        className={cn("px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2", variants[variant], className)}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all", className)}
      {...props}
    />
  )
);

// --- Main App ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100"
        >
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-zinc-900/20">
              <ExternalLink className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Stealth CDN</h1>
            <p className="text-zinc-500 mt-1">Enter password to access dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ path: string, sha: string } | null>(null);
  // Rename Confirmation State
  const [renameConfirm, setRenameConfirm] = useState<{ path: string, sha: string, newName: string } | null>(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setConfigError(null);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setFiles(data);
      } else {
        setConfigError(data.error || "Failed to fetch files");
      }
    } catch (err) {
      setConfigError("Could not connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let filesToUpload: File[] = [];
    if ('files' in e.target && e.target.files) {
      filesToUpload = Array.from(e.target.files);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      filesToUpload = Array.from(e.dataTransfer.files);
    }

    if (filesToUpload.length === 0) return;

    setUploadError(null);
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    for (const file of filesToUpload) {
      if (file.size > MAX_SIZE) {
        setUploadError(`File ${file.name} is too large. Max size is 50MB.`);
        return;
      }
    }

    setUploadProgress({ current: 0, total: filesToUpload.length });
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve) => {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                content: base64,
                message: `Upload ${file.name}`
              }),
            });
          } catch (err) {
            console.error(err);
          }
          resolve(null);
        };
      });
      setUploadProgress({ current: i + 1, total: filesToUpload.length });
    }
    setUploadProgress(null);
    fetchFiles();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { path, sha } = deleteConfirm;
    try {
      await fetch(`/api/files/${encodeURIComponent(path)}?sha=${sha}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = (path: string, sha: string) => {
    setRenameConfirm({ path, sha, newName: path });
  };

  const handleRenameConfirm = async () => {
    if (!renameConfirm) return;
    const { path, sha, newName } = renameConfirm;
    if (!newName || newName === path) {
      setRenameConfirm(null);
      return;
    }
    setRenaming(true);
    try {
      await fetch(`/api/files/${encodeURIComponent(path)}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPath: newName, sha }),
      });
      setRenameConfirm(null);
      fetchFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setRenaming(false);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [files, search]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <ExternalLink className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 hidden sm:block">Stealth CDN</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onLogout} className="text-zinc-500">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {configError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Edit3 className="text-amber-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-amber-900">Configuration Required</h3>
            <p className="text-amber-700 mt-2 max-w-md mx-auto">
              {configError}. Please ensure <code>GITHUB_TOKEN</code>, <code>GITHUB_OWNER</code>, and <code>GITHUB_REPO</code> are set in the AI Studio Secrets panel.
            </p>
            <Button variant="secondary" className="mt-6" onClick={fetchFiles}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {/* Upload Zone */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(e); }}
          className={cn(
            "relative group border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center text-center mb-8",
            dragActive ? "border-zinc-900 bg-zinc-900/5" : "border-zinc-200 bg-white hover:border-zinc-300",
            uploadProgress && "opacity-50 pointer-events-none"
          )}
        >
          <input 
            type="file" 
            multiple 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleUpload}
          />
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {uploadProgress ? <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" /> : <Upload className="w-8 h-8 text-zinc-400" />}
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {uploadProgress ? `Uploading ${uploadProgress.current} of ${uploadProgress.total} files...` : "Upload Assets"}
          </h3>
          <p className="text-zinc-500 mt-1">Drag and drop files here, or click to browse</p>
          {uploadError && <p className="text-red-500 mt-4 text-sm">{uploadError}</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input 
              placeholder="Search files..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-1 self-stretch sm:self-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Display */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4"
            >
              <Loader2 className="w-10 h-10 animate-spin" />
              <p>Fetching assets from GitHub...</p>
            </motion.div>
          ) : filteredFiles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white rounded-2xl border border-zinc-100"
            >
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-zinc-300 w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900">No files found</h3>
              <p className="text-zinc-500">Try a different search or upload some files.</p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {filteredFiles.map((file) => (
                <FileCard key={file.sha} file={file} onDelete={(path, sha) => setDeleteConfirm({ path, sha })} onRename={handleRename} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-zinc-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Size</th>
                    <th className="pr-10 pl-2 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredFiles.map((file) => (
                    <FileRow key={file.sha} file={file} onDelete={(path, sha) => setDeleteConfirm({ path, sha })} onRename={handleRename} />
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <Modal 
          isOpen={!!deleteConfirm} 
          onClose={() => setDeleteConfirm(null)} 
          title="Confirm Deletion"
        >
          <p className="text-zinc-500 mb-6">
            Are you sure you want to delete <span className="font-semibold text-zinc-900">{deleteConfirm?.path}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete File</Button>
          </div>
        </Modal>

        {/* Rename Modal */}
        <Modal 
          isOpen={!!renameConfirm} 
          onClose={() => setRenameConfirm(null)} 
          title="Rename File"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">New filename</label>
            <Input 
              value={renameConfirm?.newName || ''}
              onChange={(e) => setRenameConfirm(prev => prev ? {...prev, newName: e.target.value} : null)}
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRenameConfirm(null)} disabled={renaming}>Cancel</Button>
            <Button onClick={handleRenameConfirm} disabled={renaming}>
              {renaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Renaming...</> : "Rename File"}
            </Button>
          </div>
        </Modal>
          </>
        )}
        <footer className="mt-12 text-center text-sm text-zinc-500 pb-8">
          © 2026 Made With Love by ramadanny
        </footer>
      </main>
    </div>
  );
}

interface FileComponentProps {
  key?: any;
  file: any;
  onDelete: (path: string, sha: string) => void;
  onRename: (path: string, sha: string) => void;
}

function FileCard({ file, onDelete, onRename }: FileComponentProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(file.cdn_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group bg-white rounded-xl border border-zinc-200 hover:shadow-lg hover:shadow-zinc-200/50 transition-all"
    >
      <div className="aspect-square bg-zinc-50 relative rounded-t-xl overflow-hidden flex items-center justify-center">
        {isImage(file.name) ? (
          <img 
            src={file.download_url} 
            alt={file.name} 
            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-zinc-300 group-hover:opacity-80 transition-opacity duration-300">
            {getFileIcon(file.name)}
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button 
            onClick={copyLink}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-900 hover:opacity-90 transition-opacity active:opacity-75"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <a 
            href={file.cdn_url} 
            target="_blank" 
            rel="noreferrer"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-900 hover:opacity-90 transition-opacity active:opacity-75"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
          </div>
          <FileMenu file={file} onDelete={onDelete} onRename={onRename} />
        </div>
      </div>
    </motion.div>
  );
}

function FileRow({ file, onDelete, onRename }: FileComponentProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(file.cdn_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr className="hover:bg-zinc-50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
            {isImage(file.name) ? (
              <img src={file.download_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : getFileIcon(file.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate max-w-[200px] sm:max-w-xs" title={file.name}>{file.name}</p>
            <p className="text-xs text-zinc-500 sm:hidden">{formatSize(file.size)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-zinc-500 hidden sm:table-cell">
        {formatSize(file.size)}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={copyLink}
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            title="Copy CDN Link"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <a 
            href={file.cdn_url} 
            target="_blank" 
            rel="noreferrer"
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            title="Open Link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <FileMenu file={file} onDelete={onDelete} onRename={onRename} />
        </div>
      </td>
    </tr>
  );
}

function FileMenu({ file, onDelete, onRename }: { file: any, onDelete: (p: string, s: string) => void, onRename: (p: string, s: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(file.cdn_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative", isOpen && "z-40")}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-zinc-200 shadow-xl z-30 py-1 overflow-hidden"
            >
              <button 
                onClick={() => { setIsOpen(false); copyLink(); }}
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy URL"}
              </button>
              <button 
                onClick={() => { setIsOpen(false); onRename(file.path, file.sha); }}
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Rename
              </button>
              <button 
                onClick={() => { setIsOpen(false); onDelete(file.path, file.sha); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
