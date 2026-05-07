// Calculator functionality
(function() {
    'use strict';
    
    const display = document.getElementById('result');
    const clearBtn = document.getElementById('clearBtn');
    const equalsBtn = document.getElementById('equalsBtn');
    const buttonsGrid = document.querySelector('.buttons-grid');
    
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
    function handleNumberClick(num) {
        if (shouldResetDisplay) {
            if (num === '.') {
                currentInput = '0.';
            } else {
                currentInput = num;
            }
            shouldResetDisplay = false;
            lastWasOperation = false;
        } else {
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
    function handleOperationClick(op) {
        if (operator && currentInput && !lastWasOperation) {
            calculate();
        }
        
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
    
    // Event delegation for button clicks
    function handleButtonClick(e) {
        const target = e.target;
        
        if (!target.classList.contains('button')) return;
        
        const num = target.dataset.num;
        const op = target.dataset.op;
        
        if (num !== undefined) {
            handleNumberClick(num);
        } else if (op !== undefined) {
            handleOperationClick(op);
        }
    }
    
    // Event listeners
    if (clearBtn) {
        clearBtn.addEventListener('click', clearScreen);
    }
    
    if (equalsBtn) {
        equalsBtn.addEventListener('click', handleEquals);
    }
    
    // Use event delegation on grid instead of multiple listeners
    if (buttonsGrid) {
        buttonsGrid.addEventListener('click', handleButtonClick);
    }
    
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
    let mouseX = 0;
    let mouseY = 0;
    let containerRect = null;
    let animationFrameId = null;
    
    // Toggle 3D preview mode
    function toggle3DPreview() {
        is3DEnabled = !is3DEnabled;
        
        if (is3DEnabled) {
            preview3DBtn.textContent = 'Disable 3D Preview';
            preview3DBtn.classList.add('active');
            calculatorElement.classList.add('perspective-3d', 'glow-3d');
            perspectiveContainer.addEventListener('mousemove', handleMouseMove);
            perspectiveContainer.addEventListener('mouseleave', reset3DTransform);
        } else {
            preview3DBtn.textContent = 'Enable 3D Preview';
            preview3DBtn.classList.remove('active');
            calculatorElement.classList.remove('perspective-3d', 'glow-3d');
            perspectiveContainer.removeEventListener('mousemove', handleMouseMove);
            perspectiveContainer.removeEventListener('mouseleave', reset3DTransform);
            
            // Cancel any pending animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            calculatorElement.style.transform = '';
        }
    }
    
    // Handle mouse movement - stores coordinates only
    function handleMouseMove(e) {
        if (!is3DEnabled) return;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Only update rect occasionally for performance
        if (!containerRect) {
            containerRect = perspectiveContainer.getBoundingClientRect();
        }
        
        // Request animation frame for smooth updates
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(apply3DTransform);
        }
    }
    
    // Apply 3D transform - runs once per frame
    function apply3DTransform() {
        animationFrameId = null;
        
        if (!is3DEnabled || !containerRect) return;
        
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        const relativeX = mouseX - containerRect.left;
        const relativeY = mouseY - containerRect.top;
        
        const rotateX = ((relativeY - centerY) / centerY) * 12;
        const rotateY = ((relativeX - centerX) / centerX) * 12;
        
        const distance = Math.hypot(relativeX - centerX, relativeY - centerY);
        const maxDistance = Math.hypot(centerX, centerY);
        const scale = 1 + (1 - distance / maxDistance) * 0.03;
        
        calculatorElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    }
    
    // Reset 3D transform when mouse leaves
    function reset3DTransform() {
        if (is3DEnabled) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            calculatorElement.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            containerRect = null;
        }
    }
    
    // Update container rect on resize for responsive
    function handleResize() {
        containerRect = null;
    }
    
    // Event listeners
    if (preview3DBtn) {
        preview3DBtn.addEventListener('click', toggle3DPreview);
    }
    
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
})();