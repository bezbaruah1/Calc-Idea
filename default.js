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
    let lastWasOperation = false;
    
    // Clear screen function
    function clearScreen() {
        currentInput = '';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        lastWasOperation = false;
        updateDisplay('0');
    }
    
    // Update display
    function updateDisplay(value) {
        display.value = value.toString();
    }
    
    // Add number to display
    function handleNumberClick(e) {
        const num = e.target.dataset.num;
        
        if (shouldResetDisplay) {
            // Starting a new number after an operation
            if (num === '.') {
                currentInput = '0.';
            } else {
                currentInput = num;
            }
            shouldResetDisplay = false;
            lastWasOperation = false;
        } else {
            // Prevent multiple decimals
            if (num === '.') {
                if (currentInput === '') {
                    currentInput = '0.';
                } else if (currentInput.includes('.')) {
                    return;
                } else {
                    currentInput += num;
                }
            } else {
                currentInput += num;
            }
        }
        updateDisplay(currentInput || '0');
    }
    
    // Handle operations
    function handleOperationClick(e) {
        const op = e.target.dataset.op;
        
        // If there's already an operation pending and current input exists, calculate first
        if (operator && currentInput && !lastWasOperation) {
            calculate();
        }
        
        // If no previous input, use current as previous
        if (!previousInput && currentInput) {
            previousInput = currentInput;
        }
        
        operator = op;
        currentInput = '';
        shouldResetDisplay = true;
        lastWasOperation = true;
    }
    
    // Safe calculation without eval()
    function calculate() {
        if (!operator || previousInput === '' || currentInput === '') {
            return;
        }
        
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        let result = 0;
        
        if (isNaN(prev) || isNaN(current)) {
            return;
        }
        
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
                        clearScreen();
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
            lastWasOperation = false;
            updateDisplay(result);
        } catch (error) {
            updateDisplay('Error');
            clearScreen();
        }
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

// 3D Preview Functionality
(function() {
    'use strict';
    
    const preview3DBtn = document.getElementById('preview3DBtn');
    const calculatorElement = document.getElementById('calculatorElement');
    const perspectiveContainer = document.querySelector('.perspective-container');
    
    let is3DEnabled = false;
    
    // Toggle 3D preview mode
    function toggle3DPreview() {
        is3DEnabled = !is3DEnabled;
        
        if (is3DEnabled) {
            preview3DBtn.textContent = 'Disable 3D Preview';
            preview3DBtn.classList.add('active');
            calculatorElement.classList.add('perspective-3d', 'glow-3d');
            perspectiveContainer.addEventListener('mousemove', handle3DMouseMove);
            perspectiveContainer.addEventListener('mouseleave', reset3DTransform);
        } else {
            preview3DBtn.textContent = 'Enable 3D Preview';
            preview3DBtn.classList.remove('active');
            calculatorElement.classList.remove('perspective-3d', 'glow-3d');
            perspectiveContainer.removeEventListener('mousemove', handle3DMouseMove);
            perspectiveContainer.removeEventListener('mouseleave', reset3DTransform);
            calculatorElement.style.transform = '';
        }
    }
    
    // Handle mouse movement for 3D effect
    function handle3DMouseMove(e) {
        if (!is3DEnabled) return;
        
        const rect = perspectiveContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const rotateX = ((mouseY - centerY) / centerY) * 15;
        const rotateY = ((mouseX - centerX) / centerX) * 15;
        
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        const scale = 1 + (1 - distance / maxDistance) * 0.05;
        
        calculatorElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    }
    
    // Reset 3D transform when mouse leaves
    function reset3DTransform() {
        if (is3DEnabled) {
            calculatorElement.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        }
    }
    
    // Event listener for toggle button
    if (preview3DBtn) {
        preview3DBtn.addEventListener('click', toggle3DPreview);
    }
})();