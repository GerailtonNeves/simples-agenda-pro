/* ==========================================================================
   SIMPLES AGENDA PRO - COMMERCIAL CALCULATOR ENGINE
   ========================================================================== */

class CalculatorEngine {
  constructor() {
    this.displayValue = '0';
    this.expression = '';
    this.history = [];
    this.isNewOperand = true;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btnOpenCalculator')?.addEventListener('click', () => {
      this.openModal();
    });

    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = btn.dataset.val;
        const action = btn.dataset.action;

        if (val !== undefined) {
          this.appendDigit(val);
        } else if (action) {
          this.handleAction(action);
        }
      });
    });

    // Suporte ao teclado
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modalCalculator');
      if (!modal || !modal.classList.contains('active')) return;

      if (e.key >= '0' && e.key <= '9') this.appendDigit(e.key);
      else if (e.key === '.' || e.key === ',') this.appendDigit('.');
      else if (e.key === '+') this.handleAction('+');
      else if (e.key === '-') this.handleAction('-');
      else if (e.key === '*') this.handleAction('*');
      else if (e.key === '/') this.handleAction('/');
      else if (e.key === 'Enter' || e.key === '=') this.handleAction('eval');
      else if (e.key === 'Backspace') this.handleAction('backspace');
      else if (e.key === 'Escape') modal.classList.remove('active');
    });
  }

  openModal() {
    const modal = document.getElementById('modalCalculator');
    if (modal) {
      this.reset();
      modal.classList.add('active');
    }
  }

  reset() {
    this.displayValue = '0';
    this.expression = '';
    this.isNewOperand = true;
    this.updateDisplay();
  }

  appendDigit(digit) {
    if (digit === '.' && this.displayValue.includes('.')) return;

    if (this.isNewOperand) {
      this.displayValue = digit === '.' ? '0.' : digit;
      this.isNewOperand = false;
    } else {
      if (this.displayValue === '0' && digit !== '.') {
        this.displayValue = digit;
      } else {
        this.displayValue += digit;
      }
    }
    this.updateDisplay();
  }

  handleAction(action) {
    if (action === 'clear') {
      this.reset();
    } else if (action === 'backspace') {
      if (this.displayValue.length > 1) {
        this.displayValue = this.displayValue.slice(0, -1);
      } else {
        this.displayValue = '0';
        this.isNewOperand = true;
      }
      this.updateDisplay();
    } else if (action === 'percent') {
      const num = parseFloat(this.displayValue) || 0;
      this.displayValue = (num / 100).toString();
      this.updateDisplay();
    } else if (['+', '-', '*', '/'].includes(action)) {
      this.expression = `${this.displayValue} ${action} `;
      this.isNewOperand = true;
      this.updateDisplay();
    } else if (action === 'eval') {
      if (!this.expression) return;
      try {
        const fullExpr = this.expression + this.displayValue;
        const sanitized = fullExpr.replace(/[^0-9\+\-\*\/\.]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        
        this.expression = `${fullExpr} =`;
        this.displayValue = parseFloat(result.toFixed(4)).toString();
        this.isNewOperand = true;
        this.updateDisplay();
      } catch (e) {
        this.displayValue = 'Erro';
        this.isNewOperand = true;
        this.updateDisplay();
      }
    }
  }

  updateDisplay() {
    const mainDisp = document.getElementById('calcMainDisplay');
    const subDisp = document.getElementById('calcSubDisplay');

    if (mainDisp) {
      const num = parseFloat(this.displayValue);
      if (!isNaN(num) && this.displayValue !== 'Erro') {
        mainDisp.textContent = this.displayValue.includes('.') ? this.displayValue : num.toLocaleString('pt-BR');
      } else {
        mainDisp.textContent = this.displayValue;
      }
    }

    if (subDisp) {
      subDisp.textContent = this.expression;
    }
  }
}

window.Calculator = new CalculatorEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.Calculator.init();
});
