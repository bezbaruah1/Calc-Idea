(function(){
  'use strict';

  const display = document.getElementById('result');
  const buttonsGrid = document.querySelector('.buttons-grid');
  const advancedRow = document.querySelector('.advanced-row');
  const clearBtn = document.getElementById('clearBtn');
  const equalsBtn = document.getElementById('equalsBtn');
  const historyList = document.getElementById('historyList');
  const historyPanel = document.getElementById('historyPanel');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const themeToggle = document.getElementById('themeToggle');

  let expr = '';
  const HISTORY_KEY = 'calc_history_v1';

  // --- Display helpers ---
  function renderDisplay(text){ display.value = text; }
  function appendToExpr(token){ expr += token; renderDisplay(expr||'0'); }
  function resetExpr(){ expr = ''; renderDisplay('0'); }

  // --- Tokenizer ---
  function tokenize(s){
    const tokens = [];
    let i=0;
    while(i<s.length){
      const ch = s[i];
      if(/\s/.test(ch)){ i++; continue; }
      if(/[0-9.]/.test(ch)){
        let num = ch; i++;
        while(i<s.length && /[0-9.]/.test(s[i])){ num+=s[i++]; }
        tokens.push({type:'number',value:parseFloat(num)});
        continue;
      }
      if(/[+\-*/^()%]/.test(ch)){
        tokens.push({type:'op',value:ch}); i++; continue;
      }
      // names: functions or constants
      if(/[a-zA-Z]/.test(ch)){
        let name = ch; i++;
        while(i<s.length && /[a-zA-Z0-9]/.test(s[i])){ name+=s[i++]; }
        tokens.push({type:'name',value:name.toLowerCase()});
        continue;
      }
      // unknown
      i++;
    }
    return tokens;
  }

  // --- Shunting-yard to RPN ---
  const OPS = {
    '+':{prec:2,assoc:'L'}, '-':{prec:2,assoc:'L'}, '*':{prec:3,assoc:'L'}, '/':{prec:3,assoc:'L'}, '^':{prec:4,assoc:'R'}
  };

  function toRPN(tokens){
    const out=[]; const stack=[];
    for(const t of tokens){
      if(t.type==='number'){ out.push(t); }
      else if(t.type==='name'){ stack.push(t); }
      else if(t.type==='op'){
        if(t.value==='('){ stack.push(t); }
        else if(t.value===')'){
          while(stack.length && stack[stack.length-1].value!=='('){ out.push(stack.pop()); }
          stack.pop(); // pop (
          // if function on top, move it
          if(stack.length && stack[stack.length-1].type==='name') out.push(stack.pop());
        } else {
          while(stack.length){
            const top = stack[stack.length-1];
            if(top.type==='op' && top.value!=='('){
              const a = OPS[t.value]; const b = OPS[top.value];
              if(b && ( (a.assoc==='L' && a.prec<=b.prec) || (a.assoc==='R' && a.prec<b.prec) )){
                out.push(stack.pop()); continue;
              }
            }
            break;
          }
          stack.push(t);
        }
      }
    }
    while(stack.length) out.push(stack.pop());
    return out;
  }

  // --- RPN evaluation ---
  function evalRPN(rpn){
    const st=[];
    for(const t of rpn){
      if(t.type==='number'){ st.push(t.value); }
      else if(t.type==='op'){
        const b=st.pop(); const a=st.pop();
        if(a===undefined || b===undefined) throw new Error('Malformed');
        switch(t.value){
          case '+': st.push(a+b); break;
          case '-': st.push(a-b); break;
          case '*': st.push(a*b); break;
          case '/': if(b===0) throw new Error('Division by zero'); st.push(a/b); break;
          case '^': st.push(Math.pow(a,b)); break;
          default: throw new Error('Unknown op');
        }
      } else if(t.type==='name'){
        const name = t.value;
        if(['sin','cos','tan','sqrt','ln','log'].includes(name)){
          const v = st.pop(); if(v===undefined) throw new Error('Malformed');
          switch(name){
            case 'sin': st.push(Math.sin(v)); break;
            case 'cos': st.push(Math.cos(v)); break;
            case 'tan': st.push(Math.tan(v)); break;
            case 'sqrt': st.push(Math.sqrt(v)); break;
            case 'ln': st.push(Math.log(v)); break;
            case 'log': st.push(Math.log10 ? Math.log10(v) : Math.log(v)/Math.LN10); break;
          }
        } else if(name==='pi'){ st.push(Math.PI); }
        else if(name==='e'){ st.push(Math.E); }
        else throw new Error('Unknown name: '+name);
      }
    }
    if(st.length!==1) throw new Error('Malformed');
    return st[0];
  }

  function evaluateExpression(s){
    const tokens = tokenize(s);
    const rpn = toRPN(tokens);
    const res = evalRPN(rpn);
    // rounding small floating errors
    const rounded = Math.round((res + Number.EPSILON) * 100000000) / 100000000;
    return rounded;
  }

  // --- History ---
  function loadHistory(){
    try{ const raw=localStorage.getItem(HISTORY_KEY); return raw?JSON.parse(raw):[]; }catch(e){return[]}
  }
  function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0,100))); }
  function addHistory(expr,result){ const h=loadHistory(); h.unshift({expr,result,time:Date.now()}); saveHistory(h); renderHistory(); }
  function clearHistory(){ localStorage.removeItem(HISTORY_KEY); renderHistory(); }
  function renderHistory(){ const h=loadHistory(); historyList.innerHTML=''; h.forEach(item=>{
    const li=document.createElement('li'); li.textContent = item.expr + ' = ' + item.result; li.tabIndex=0;
    li.addEventListener('click', ()=>{ expr = item.expr; renderDisplay(expr); }); historyList.appendChild(li);
  }); }

  // --- Event handlers ---
  function handleGridClick(e){ const t=e.target; if(!t.classList.contains('button')) return;
    const num = t.dataset.num; const op = t.dataset.op; const fn = t.dataset.fn;
    if(num!==undefined){ appendToExpr(num); }
    else if(op!==undefined){ appendToExpr(op); }
    else if(fn!==undefined){ if(fn==='pi') appendToExpr('pi'); else appendToExpr(fn); }
  }

  function handleEquals(){ if(!expr) return; try{ const res=evaluateExpression(expr); renderDisplay(String(res)); addHistory(expr,res); expr = String(res); }catch(err){ renderDisplay('Error'); expr=''; }}
  function handleClear(){ resetExpr(); }

  // Keyboard
  function handleKey(e){ if(e.repeat) return; const k=e.key;
    if((/^[0-9]$/).test(k)){ appendToExpr(k); }
    else if(k==='.' ){ appendToExpr('.'); }
    else if(k==='+'||k==='-'||k==='*'||k==='/'||k==='^'){ appendToExpr(k); }
    else if(k==='('||k===')'){ appendToExpr(k); }
    else if(k==='Enter' || k==='='){ e.preventDefault(); handleEquals(); }
    else if(k==='Backspace'){ expr = expr.slice(0,-1); renderDisplay(expr||'0'); }
    else if(k==='Escape'){ handleClear(); }
    // quick function shortcuts
    else if(k==='p'){ appendToExpr('pi'); }
  }

  // Theme
  function applySavedTheme(){ const t = localStorage.getItem('calc_theme'); if(t) document.documentElement.setAttribute('data-theme', t); }
  function toggleTheme(){ const cur = document.documentElement.getAttribute('data-theme') || 'dark'; const next = cur==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem('calc_theme', next); themeToggle.setAttribute('aria-pressed', String(next==='light')); }

  // Wire up
  if(buttonsGrid) buttonsGrid.addEventListener('click', handleGridClick);
  if(advancedRow) advancedRow.addEventListener('click', handleGridClick);
  if(clearBtn) clearBtn.addEventListener('click', handleClear);
  if(equalsBtn) equalsBtn.addEventListener('click', handleEquals);
  if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', ()=>{ clearHistory(); });
  if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
  window.addEventListener('keydown', handleKey);

  // init
  resetExpr(); renderHistory(); applySavedTheme();
})();
