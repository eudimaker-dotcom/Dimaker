
import React, { useState, useEffect } from 'react';
import { Layout, History as HistoryIcon, Menu, X, Github, GraduationCap, Zap, Brain } from 'lucide-react';
import { analyzeMathImage, refineSolution } from './services/geminiService';
import { MathSolution, ViewMode, SolverMode } from './types';
import UploadArea from './components/UploadArea';
import SolutionView from './components/SolutionView';
import CameraCapture from './components/CameraCapture';
import MathRenderer from './components/MathRenderer';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.UPLOAD);
  const [solverMode, setSolverMode] = useState<SolverMode>(SolverMode.PROFESSOR);
  const [currentSolution, setCurrentSolution] = useState<MathSolution | null>(null);
  const [history, setHistory] = useState<MathSolution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mathSolverHistory_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const saveToHistory = (solution: MathSolution) => {
    const newHistory = [solution, ...history].slice(0, 50); 
    setHistory(newHistory);
    localStorage.setItem('mathSolverHistory_v2', JSON.stringify(newHistory));
  };

  const handleImageSelected = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const solution = await analyzeMathImage(base64, solverMode);
      setCurrentSolution(solution);
      saveToHistory(solution);
      setViewMode(ViewMode.SOLUTION);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinement = async (currentLatex: string, instruction: string) => {
    setIsLoading(true);
    try {
        const updatedSolution = await refineSolution(currentLatex, instruction, solverMode);
        const merged = { ...updatedSolution, originalImage: currentSolution?.originalImage };
        setCurrentSolution(merged);
        saveToHistory(merged);
    } catch (err: any) {
        setError("Falha ao atualizar a solução.");
    } finally {
        setIsLoading(false);
    }
  };

  const loadFromHistory = (solution: MathSolution) => {
    setCurrentSolution(solution);
    setViewMode(ViewMode.SOLUTION);
    setShowHistorySidebar(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewMode(ViewMode.UPLOAD)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              √
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:inline">
              Math<span className="text-indigo-600">Pro</span>
            </span>
          </div>

          {/* Mode Toggle (Visible on Upload Screen primarily) */}
          {viewMode === ViewMode.UPLOAD && (
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                    onClick={() => setSolverMode(SolverMode.PROFESSOR)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${solverMode === SolverMode.PROFESSOR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <GraduationCap className="w-3.5 h-3.5" /> Prof.
                </button>
                <button 
                    onClick={() => setSolverMode(SolverMode.FAST)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${solverMode === SolverMode.FAST ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Zap className="w-3.5 h-3.5" /> Rápido
                </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistorySidebar(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 relative"
            >
              <HistoryIcon className="w-5 h-5" />
              {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-12 relative">
        
        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {viewMode === ViewMode.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8 max-w-lg">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Resolva Matemática <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Como um Profissional</span>
              </h1>
              <p className="text-slate-500 leading-relaxed">
                OCR avançado para cálculo, álgebra e matrizes. <br/> 
                Soluções passo a passo verificadas.
              </p>
            </div>
            <UploadArea 
              onImageSelected={handleImageSelected} 
              onCameraRequest={() => setViewMode(ViewMode.CAMERA)}
              isLoading={isLoading}
            />
          </div>
        )}

        {viewMode === ViewMode.CAMERA && (
          <CameraCapture 
            onCapture={(base64) => {
              setViewMode(ViewMode.UPLOAD);
              handleImageSelected(base64);
            }}
            onClose={() => setViewMode(ViewMode.UPLOAD)}
          />
        )}

        {viewMode === ViewMode.SOLUTION && currentSolution && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <SolutionView 
              solution={currentSolution} 
              onReset={() => setViewMode(ViewMode.UPLOAD)}
              onRefine={handleRefinement}
              mode={solverMode}
            />
          </div>
        )}

        {/* Loader */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
            </div>
            <p className="mt-6 text-slate-600 font-medium animate-pulse">
                {viewMode === ViewMode.UPLOAD ? "Lendo imagem e resolvendo..." : "Recalculando..."}
            </p>
            <p className="text-xs text-slate-400 mt-2">Isso pode levar alguns segundos</p>
          </div>
        )}
      </main>

      {/* History Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 ${showHistorySidebar ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" /> Histórico
          </h2>
          <button onClick={() => setShowHistorySidebar(false)} className="p-1 hover:bg-slate-200 rounded transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)] p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <HistoryIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm">Seus exercícios resolvidos aparecerão aqui.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => loadFromHistory(item)}
                className="group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {item.category || 'Geral'}
                   </span>
                   <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="h-12 overflow-hidden relative">
                  <div className="opacity-70 group-hover:opacity-100 transition-opacity scale-90 origin-top-left">
                    <MathRenderer expression={item.latexExpression} className="text-xs pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white group-hover:from-indigo-50/10 to-transparent"></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showHistorySidebar && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          onClick={() => setShowHistorySidebar(false)}
        ></div>
      )}
    </div>
  );
}

export default App;
