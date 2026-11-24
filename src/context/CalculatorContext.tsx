'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

export type CalcOperator = '+' | '-' | '*' | '/' | null;

export interface CalculatorPosition {
  x: number;
  y: number;
}

export interface CalculatorContextType {
  isOpen: boolean;
  isMinimized: boolean;
  position: CalculatorPosition | null;
  display: string;
  expression: string;
  activeOperator: CalcOperator;
  openCalculator: () => void;
  closeCalculator: () => void;
  toggleCalculator: () => void;
  toggleMinimize: () => void;
  setPosition: (pos: CalculatorPosition) => void;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  clearAll: () => void;
  toggleSign: () => void;
  inputPercent: () => void;
  performOperation: (nextOp: CalcOperator) => void;
  evaluateResult: () => void;
  backspace: () => void;
}

const CALC_STORAGE_KEY = 'mafrend_calculator_v1';

interface StoredCalcState {
  isOpen: boolean;
  isMinimized: boolean;
  position: CalculatorPosition | null;
  display: string;
  expression: string;
  prevValue: number | null;
  operator: CalcOperator;
  waitingForOperand: boolean;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

function formatOperatorSymbol(op: CalcOperator): string {
  if (op === '/') return '÷';
  if (op === '*') return '×';
  if (op === '-') return '−';
  if (op === '+') return '+';
  return '';
}

function formatNumberId(val: number): string {
  if (!Number.isFinite(val)) return 'Error';
  const rounded = Math.round(val * 1000000) / 1000000;
  return String(rounded);
}

export function formatCalculatorDisplay(raw: string): string {
  if (raw === 'Error') return 'Error';
  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [intPart, decPart] = unsigned.split('.');
  const formattedInt = intPart
    ? Number(intPart).toLocaleString('id-ID')
    : '0';
  const sign = isNegative ? '-' : '';
  if (decPart !== undefined) {
    return `${sign}${formattedInt},${decPart}`;
  }
  return `${sign}${formattedInt}`;
}

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPositionState] = useState<CalculatorPosition | null>(null);
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Restore calculator state from localStorage on client mount
  useEffect(() => {
    let isMounted = true;

    async function loadSavedState() {
      await Promise.resolve();
      if (!isMounted) return;

      try {
        const raw = localStorage.getItem(CALC_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredCalcState>;
          if (typeof parsed.isOpen === 'boolean') setIsOpen(parsed.isOpen);
          if (typeof parsed.isMinimized === 'boolean') setIsMinimized(parsed.isMinimized);
          if (
            parsed.position &&
            typeof parsed.position.x === 'number' &&
            typeof parsed.position.y === 'number'
          ) {
            setPositionState(parsed.position);
          }
          if (typeof parsed.display === 'string' && parsed.display) {
            setDisplay(parsed.display);
          }
          if (typeof parsed.expression === 'string') {
            setExpression(parsed.expression);
          }
          if (typeof parsed.prevValue === 'number' || parsed.prevValue === null) {
            setPrevValue(parsed.prevValue ?? null);
          }
          if (
            parsed.operator === '+' ||
            parsed.operator === '-' ||
            parsed.operator === '*' ||
            parsed.operator === '/' ||
            parsed.operator === null
          ) {
            setOperator(parsed.operator);
          }
          if (typeof parsed.waitingForOperand === 'boolean') {
            setWaitingForOperand(parsed.waitingForOperand);
          }
        }
      } catch {
        // Ignore invalid persisted JSON
      }
      setHydrated(true);
    }

    void loadSavedState();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist changes to localStorage so state survives route changes and reloads
  useEffect(() => {
    if (!hydrated) return;
    try {
      const stateToSave: StoredCalcState = {
        isOpen,
        isMinimized,
        position,
        display,
        expression,
        prevValue,
        operator,
        waitingForOperand,
      };
      localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, [
    hydrated,
    isOpen,
    isMinimized,
    position,
    display,
    expression,
    prevValue,
    operator,
    waitingForOperand,
  ]);

  const openCalculator = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeCalculator = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCalculator = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsMinimized(false);
      }
      return !prev;
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const setPosition = useCallback((pos: CalculatorPosition) => {
    setPositionState(pos);
  }, []);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      if (display === 'Error') {
        setDisplay(digit);
        setExpression('');
        setWaitingForOperand(false);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        if (display.replace('-', '').replace('.', '').length >= 12) return;
        setDisplay(display === '0' ? digit : display + digit);
      }
    },
    [display, waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    if (display === 'Error' || waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(`${display}.`);
    }
  }, [display, waitingForOperand]);

  const toggleSign = useCallback(() => {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  }, [display]);

  const inputPercent = useCallback(() => {
    if (display === 'Error') return;
    const current = parseFloat(display);
    if (Number.isNaN(current)) return;
    const next = current / 100;
    setDisplay(formatNumberId(next));
  }, [display]);

  const backspace = useCallback(() => {
    if (waitingForOperand || display === 'Error') return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  }, [display, waitingForOperand]);

  const compute = (left: number, right: number, op: CalcOperator): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return right === 0 ? Number.NaN : left / right;
      default:
        return right;
    }
  };

  const performOperation = useCallback(
    (nextOp: CalcOperator) => {
      if (display === 'Error') {
        clearAll();
        return;
      }
      const inputValue = parseFloat(display);

      if (prevValue === null) {
        setPrevValue(inputValue);
        setExpression(`${formatCalculatorDisplay(display)} ${formatOperatorSymbol(nextOp)}`);
      } else if (operator && !waitingForOperand) {
        const result = compute(prevValue, inputValue, operator);
        if (!Number.isFinite(result)) {
          setDisplay('Error');
          setExpression('');
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          return;
        }
        const formatted = formatNumberId(result);
        setDisplay(formatted);
        setPrevValue(result);
        setExpression(`${formatCalculatorDisplay(formatted)} ${formatOperatorSymbol(nextOp)}`);
      } else {
        setExpression(
          `${formatCalculatorDisplay(formatNumberId(prevValue))} ${formatOperatorSymbol(nextOp)}`
        );
      }

      setWaitingForOperand(true);
      setOperator(nextOp);
    },
    [display, operator, prevValue, waitingForOperand, clearAll]
  );

  const evaluateResult = useCallback(() => {
    if (operator === null || prevValue === null || display === 'Error') return;
    const inputValue = parseFloat(display);
    const result = compute(prevValue, inputValue, operator);
    if (!Number.isFinite(result)) {
      setDisplay('Error');
      setExpression('');
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      return;
    }
    const formatted = formatNumberId(result);
    setExpression(
      `${formatCalculatorDisplay(formatNumberId(prevValue))} ${formatOperatorSymbol(operator)} ${formatCalculatorDisplay(display)} =`
    );
    setDisplay(formatted);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, operator, prevValue]);

  // Global Alt+K shortcut to toggle calculator from any page
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleCalculator();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [toggleCalculator]);

  const value = useMemo<CalculatorContextType>(
    () => ({
      isOpen,
      isMinimized,
      position,
      display,
      expression,
      activeOperator: waitingForOperand ? operator : null,
      openCalculator,
      closeCalculator,
      toggleCalculator,
      toggleMinimize,
      setPosition,
      inputDigit,
      inputDecimal,
      clearAll,
      toggleSign,
      inputPercent,
      performOperation,
      evaluateResult,
      backspace,
    }),
    [
      isOpen,
      isMinimized,
      position,
      display,
      expression,
      waitingForOperand,
      operator,
      openCalculator,
      closeCalculator,
      toggleCalculator,
      toggleMinimize,
      setPosition,
      inputDigit,
      inputDecimal,
      clearAll,
      toggleSign,
      inputPercent,
      performOperation,
      evaluateResult,
      backspace,
    ]
  );

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator(): CalculatorContextType {
  const ctx = useContext(CalculatorContext);
  if (!ctx) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return ctx;
}
