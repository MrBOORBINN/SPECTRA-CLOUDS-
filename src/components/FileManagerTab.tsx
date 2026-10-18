// FileManagerTab Component
// Full-featured Minecraft server file explorer and in-browser code/config editor

import React, { useState, useEffect } from 'react';
import {
  FolderClosed,
  FileText,
  FileCode,
  FolderPlus,
  FilePlus,
  Trash2,
  Download,
  Upload,
  Save,
  X,
  ChevronRight,
  ArrowLeft,
  Edit3
} from 'lucide-react';
import { api } from '../lib/api';
import { Server, ServerFile } from '../types';

interface FileManagerTabProps {
  server: Server;
}

export const FileManagerTab: React.FC<FileManagerTabProps> = ({ server }) => {
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [loading, setLoading] = useState(false);

  // Editor Modal
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newIsDirectory, setNewIsDirectory] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.getFiles(server.id, currentFolder);
      setFiles(res.files || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [server.id, currentFolder]);

  const handleOpenFile = async (file: ServerFile) => {
    if (file.isDirectory) {
      setCurrentFolder(file.path);
    } else {
      try {
        const data = await api.getFileContent(server.id, file.path);
        setEditingFile({ path: file.path, name: file.name, content: data.content });
        setEditorContent(data.content);
      } catch (err: any) {
        alert('Could not read file: ' + err.message);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSavingFile(true);
    try {
      await api.saveFileContent(server.id, editingFile.path, editorContent);
      setEditingFile(null);
      fetchFiles();
    } catch (err: any) {
      alert('Failed to save file: ' + err.message);
    } finally {
      setSavingFile(false);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete ${path}? This action cannot be undone.`)) return;
    try {
      await api.deleteFile(server.id, path);
      fetchFiles();
    } catch (err: any) {
      alert('Failed to delete file: ' + err.message);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullPath = currentFolder ? `${currentFolder}/${newFileName.trim()}` : newFileName.trim();
    try {
      await api.createFile(server.id, fullPath, newIsDirectory);
      setShowCreateModal(false);
      setNewFileName('');
      fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-[#1E293B]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setCurrentFolder('')}
            className={`px-2 py-1 rounded-md hover:bg-slate-800 transition-colors ${
              currentFolder === '' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            /root
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold">{currentFolder}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentFolder && (
            <button
              onClick={() => {
                const parts = currentFolder.split('/');
                parts.pop();
                setCurrentFolder(parts.join('/'));
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={() => {
              setNewIsDirectory(false);
              setShowCreateModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>

          <button
            onClick={() => {
              setNewIsDirectory(true);
              setShowCreateModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Files Table List */}
      <div className="rounded-2xl glass-panel border border-[#1E293B] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4 hidden sm:table-cell">Size</th>
              <th className="py-3 px-4 hidden md:table-cell">Modified</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {files.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                  This folder is empty.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr
                  key={file.path}
                  className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() => handleOpenFile(file)}
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    {file.isDirectory ? (
                      <FolderClosed className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : file.name.endsWith('.yml') || file.name.endsWith('.json') || file.name.endsWith('.properties') ? (
                      <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-white group-hover:text-indigo-300 font-medium">
                      {file.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                    {file.isDirectory ? '-' : formatFileSize(file.size)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] hidden md:table-cell font-sans">
                    {new Date(file.lastModified).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {!file.isDirectory && (
                        <button
                          onClick={() => handleOpenFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit File"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.path)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Text Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl h-[85vh] rounded-3xl glass-panel border border-[#1E293B] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#090D18]">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>{editingFile.name}</span>
                <span className="text-xs text-slate-500 font-normal font-sans">({editingFile.path})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFile}
                  disabled={savingFile}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingFile ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#05070D]">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-full bg-transparent font-mono-code text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create New Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-[#1E293B] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">
              {newIsDirectory ? 'Create New Folder' : 'Create New File'}
            </h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={newIsDirectory ? 'world_nether' : 'whitelist.json'}
                  className="w-full bg-[#090D18] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
