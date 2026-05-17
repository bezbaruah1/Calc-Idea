(function(){
    function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
    function qsa(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }

    var headers = qsa('header');
    if(!headers.length) return;

    headers.forEach(function(header){
        var h1 = qs('h1', header);
        if(!h1) return;

        var raf = null;
        var targetX = 0;
        var targetY = 0;

        function updateTransform(){
            raf = null;
            var rect = header.getBoundingClientRect();
            var rotY = (targetX / rect.width) * 180;
            var rotX = -(targetY / rect.height) * 22;
            h1.style.transform = 'translateZ(32px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        }

        function queueUpdate(e){
            var rect = header.getBoundingClientRect();
            var pointerX = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
            var pointerY = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : rect.top + rect.height / 2);
            targetX = (pointerX - rect.left) - rect.width * 0.5;
            targetY = (pointerY - rect.top) - rect.height * 0.5;

            if(!raf){
                raf = requestAnimationFrame(updateTransform);
            }
        }

        function resetTransform(){
            targetX = 0;
            targetY = 0;
            if(raf){ cancelAnimationFrame(raf); raf = null; }
            h1.style.transform = 'translateZ(0) rotateX(0) rotateY(0)';
        }

        header.classList.add('three-d');
        header.addEventListener('mousemove', queueUpdate);
        header.addEventListener('mouseleave', resetTransform);
        header.addEventListener('touchmove', function(e){
            if(!e.touches.length) return;
            queueUpdate(e);
        }, { passive: true });
        header.addEventListener('touchend', resetTransform);
    });
})();
