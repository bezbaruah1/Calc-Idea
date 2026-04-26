// Calculator functionality
(function() {
    'use strict';
    
    const display = document.getElementById('result');
    const clearBtn = document.getElementById('clearBtn');
    const equalsBtn = document.getElementById('equalsBtn');
    const numButtons = document.querySelectorAll('[data-num]');
    const opButtons = document.querySelectorAll('[data-op]');
    
    let currentInput = '';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;
    
    // Clear screen function
    function clearScreen() {
        currentInput = '';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        updateDisplay('0');
    }
    
    // Update display
    function updateDisplay(value) {
        display.value = value;
    }
    
    // Add number to display
    function handleNumberClick(e) {
        const num = e.target.dataset.num;
        
        if (shouldResetDisplay) {
            currentInput = num;
            shouldResetDisplay = false;
        } else {
            // Prevent multiple decimals
            if (num === '.' && currentInput.includes('.')) {
                return;
            }
            currentInput += num;
        }
        updateDisplay(currentInput || '0');
    }
    
    // Handle operations
    function handleOperationClick(e) {
        const op = e.target.dataset.op;
        
        if (operator && currentInput) {
            calculate();
        }
        
        previousInput = currentInput;
        operator = op;
        currentInput = '';
        shouldResetDisplay = true;
    }
    
    // Safe calculation without eval()
    function calculate() {
        if (!operator || !previousInput || !currentInput) {
            return;
        }
        
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        let result = 0;
        
        try {
            switch(operator) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) {
                        updateDisplay('Error: Division by zero');
                        resetCalculator();
                        return;
                    }
                    result = prev / current;
                    break;
                default:
                    return;
            }
            
            // Round to avoid floating point errors
            result = Math.round(result * 100000000) / 100000000;
            
            currentInput = result.toString();
            operator = null;
            previousInput = '';
            shouldResetDisplay = true;
            updateDisplay(result);
        } catch (error) {
            updateDisplay('Error');
            resetCalculator();
        }
    }
    
    function resetCalculator() {
        currentInput = '';
        previousInput = '';
        operator = null;
        shouldResetDisplay = true;
    }
    
    // Handle equals button
    function handleEquals() {
        if (operator && currentInput) {
            calculate();
        }
    }
    
    // Event listeners
    if (clearBtn) {
        clearBtn.addEventListener('click', clearScreen);
    }
    
    if (equalsBtn) {
        equalsBtn.addEventListener('click', handleEquals);
    }
    
    numButtons.forEach(btn => {
        btn.addEventListener('click', handleNumberClick);
    });
    
    opButtons.forEach(btn => {
        btn.addEventListener('click', handleOperationClick);
    });
    
    // Initialize display
    updateDisplay('0');
})();