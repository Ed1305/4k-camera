import React, { useState } from 'react';
import { CapturedMedia } from '../types/camera';
import { X, Play, Download, Trash2, Film, Image as ImageIcon, HardDrive, Clock, Maximize2 } from 'lucide-react';

interface RecordingsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: CapturedMedia[];
  onDeleteMedia: (id: string) => void;
}

export const RecordingsGalleryModal: React.FC<RecordingsGalleryModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onDeleteMedia,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<CapturedMedia | null>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f121d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131726]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">4K Media Capture Vault</h3>
              <p className="text-xs text-slate-400">
                {mediaList.length} captured assets · Stored in local high-speed session memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {selectedMedia && (
            <div className="p-4 bg-black/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 font-bold truncate max-w-md">
                  {selectedMedia.name}
                </span>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Preview
                </button>
              </div>

              <div className="aspect-[16/9] w-full max-h-[360px] bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                {selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Resolution: <strong className="text-slate-200">{selectedMedia.resolution}</strong></span>
                <span>Size: <strong className="text-slate-200">{formatBytes(selectedMedia.fileSizeBytes)}</strong></span>
                <a
                  href={selectedMedia.url}
                  download={selectedMedia.name}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          )}

          {mediaList.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No Captures Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Press the circular white shutter on the viewfinder to take a 4K snapshot, or the red button to record 4K video with synchronized audio!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition-all shadow-md flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedMedia(item)}
                    className="relative aspect-[16/9] bg-black cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          VIDEO {item.durationSec ? `${item.durationSec}s` : ''}
                        </div>
                      </>
                    ) : (
                      <>
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          STILL 4K
                        </div>
                      </>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {item.resolution}
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatDate(item.timestamp)}</span>
                      <span>{formatBytes(item.fileSizeBytes)}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <a
                        href={item.url}
                        download={item.name}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                      <button
                        onClick={() => onDeleteMedia(item.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete Capture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#131726] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
