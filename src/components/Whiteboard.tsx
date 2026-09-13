import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PenLine, Eraser, Trash2, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pen2Icon } from '@solar-icons/react/bold-duotone/pen-2';
import { EraserIcon } from '@solar-icons/react/bold-duotone/eraser';
import { TrashBinTrashIcon } from '@solar-icons/react/bold-duotone/trash-bin-trash';
import { MaximizeSquare3Icon } from '@solar-icons/react/bold-duotone/maximize-square-3';

interface WhiteboardProps {
  onClose?: () => void;
  className?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ onClose, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6'); // Default sky-500
  const [lineWidth, setLineWidth] = useState(3);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = mode === 'draw' ? color : '#ffffff';
    if (mode === 'erase') {
        const isDark = document.documentElement.classList.contains('dark');
        ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff'; // Match background
    }
    ctx.lineWidth = mode === 'erase' ? 20 : lineWidth;
  }, [color, lineWidth, mode]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      
      // Save content before resize
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx?.drawImage(canvas, 0, 0);

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      // Restore content
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize with a small delay to account for animations and rendering
    const timer = setTimeout(handleResize, 100);
    const longTimer = setTimeout(handleResize, 1000);

    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
        clearTimeout(longTimer);
    };
  }, [isFullscreen]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden ${isFullscreen ? 'fixed inset-4 z-[100]' : 'w-full h-full min-h-[200px]'} ${className}`}
    >
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-[#E8192C]">
            <Pen2Icon size={20} className="text-[#E8192C]" />
          </div>
          <span className="text-[13px] font-extrabold uppercase tracking-widest text-slate-900 dark:text-white">Doska</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode('draw')}
            className={`p-2 rounded-xl transition-all ${mode === 'draw' ? 'bg-[#E8192C] text-white shadow-lg shadow-red-500/25' : 'hover:bg-muted text-slate-600 dark:text-slate-300'}`}
            title="Chizish"
          >
            <Pen2Icon size={20} />
          </button>
          <button 
            onClick={() => setMode('erase')}
            className={`p-2 rounded-xl transition-all ${mode === 'erase' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'hover:bg-muted text-slate-600 dark:text-slate-300'}`}
            title="O'chirish"
          >
            <EraserIcon size={20} />
          </button>
          <div className="w-[1px] h-5 bg-border mx-1" />
          <button 
            onClick={clearCanvas}
            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-all"
            title="Tozalash"
          >
            <TrashBinTrashIcon size={20} />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl hover:bg-muted text-slate-600 dark:text-slate-300 transition-all ml-1"
          >
            <MaximizeSquare3Icon size={20} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-slate-500 dark:text-slate-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 relative cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block touch-none"
          style={{ touchAction: 'none', pointerEvents: 'auto' }}
        />
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur border border-border rounded-full shadow-lg">
          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(c => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setMode('draw');
              }}
              className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${color === c && mode === 'draw' ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="w-[1px] h-4 bg-border mx-1" />
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-16 h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Whiteboard;
