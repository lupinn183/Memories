import React, { useState } from 'react';
import { Memory } from '../types';
import { Plus, X, Calendar, Image as ImageIcon, Music, Music2 } from 'lucide-react';

interface UIOverlayProps {
  memoriesCount: number;
  onAddClick: () => void;
  selectedMemory: Memory | null;
  onCloseDetail: () => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onAddMemory: (file: File, desc: string, date: string) => void;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  memoriesCount,
  onAddClick,
  selectedMemory,
  onCloseDetail,
  isAddModalOpen,
  onCloseAddModal,
  onAddMemory,
  isMusicPlaying,
  onToggleMusic
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6 pointer-events-none">
      
      {/* Top Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-pink-500/30">
          <h1 className="text-2xl font-bold text-pink-300">Peach Blossom Universe</h1>
          <p className="text-pink-100/70 text-sm">Stored Memories: {memoriesCount}</p>
        </div>

        <div className="flex gap-4">
            {/* Music Control */}
            {onToggleMusic && (
                <button 
                    onClick={onToggleMusic}
                    className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all hover:scale-105 border ${isMusicPlaying ? 'bg-pink-600 border-pink-400 text-white animate-pulse' : 'bg-black/40 border-gray-600 text-gray-400'}`}
                >
                    {isMusicPlaying ? <Music2 className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                </button>
            )}

            <button 
                onClick={onAddClick}
                className="group flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-full shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
            >
                <Plus className="w-5 h-5" />
                <span className="font-semibold hidden md:inline">Add Memory</span>
            </button>
        </div>
      </div>

      {/* Detail Modal (Popup) */}
      {selectedMemory && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-50">
          <div className="bg-gray-900 border border-pink-500/50 p-1 rounded-2xl shadow-2xl shadow-pink-900/50 max-w-2xl w-full mx-4 transform transition-all scale-100">
             <div className="relative bg-gray-800 rounded-xl overflow-hidden">
                <button 
                    onClick={onCloseDetail}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-64 md:h-96 bg-black flex items-center justify-center">
                        <img 
                            src={selectedMemory.url} 
                            alt="Memory" 
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                        <div className="flex items-center gap-2 text-pink-400 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-mono">{selectedMemory.date}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Memory #{selectedMemory.id}</h2>
                        <p className="text-gray-300 leading-relaxed flex-grow overflow-y-auto max-h-48">
                            {selectedMemory.description}
                        </p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto z-50">
          <div className="bg-gray-900 p-8 rounded-2xl border border-pink-500/30 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-pink-300">Store New Memory</h2>
                <button onClick={onCloseAddModal} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <AddMemoryForm onSubmit={onAddMemory} />
          </div>
        </div>
      )}

      {/* Footer Instructions */}
      <div className="text-center pointer-events-none pb-4">
        <p className="text-white/50 text-sm">
          Click and drag to explore the universe • Click images to view details
        </p>
      </div>
    </div>
  );
};

const AddMemoryForm: React.FC<{ onSubmit: (file: File, desc: string, date: string) => void }> = ({ onSubmit }) => {
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file && desc && date) {
            onSubmit(file, desc, date);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-gray-400 text-sm mb-2">Select Image</label>
                <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-pink-500 transition-colors text-center cursor-pointer">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-gray-300 text-sm">
                            {file ? file.name : "Click to upload or drag image"}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500 h-24"
                    placeholder="What happened on this day?"
                    required
                />
            </div>

            <div>
                <label className="block text-gray-400 text-sm mb-2">Date</label>
                <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-pink-500"
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={!file || !desc || !date}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
                Upload to Universe
            </button>
        </form>
    );
};