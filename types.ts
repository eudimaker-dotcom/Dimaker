
export interface MathStep {
  latex: string;
  text: string;
}

export interface SimplifyStep {
  simplifiedLatex: string;
  logicCheck: string; // "Nós simplificamos (verificação lógica)"
}

export interface InspectionStep {
  assumptions: string[];
  possibleOCRErrors: string[];
  verificationSuggestion: string;
}

export interface ConclusionStep {
  finalLatex: string;
  finalDecimal?: string; // Optional decimal approximation
  reevaluationNote: string;
}

export interface MathSolution {
  id: string;
  timestamp: number;
  originalImage?: string;
  latexExpression: string; // The raw OCR result
  
  // The 5 Mandatory Steps
  step1_calculate: MathStep;
  step2_substitute: MathStep;
  step3_simplify: SimplifyStep;
  step4_inspect: InspectionStep;
  step5_conclude: ConclusionStep;
  
  category?: string;
}

export enum SolverMode {
  PROFESSOR = 'PROFESSOR', // Detailed, formal
  FAST = 'FAST' // Direct
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: MathSolution | null;
}

export enum ViewMode {
  UPLOAD = 'UPLOAD',
  CAMERA = 'CAMERA',
  SOLUTION = 'SOLUTION',
  HISTORY = 'HISTORY'
}
