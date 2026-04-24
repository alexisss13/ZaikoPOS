// 🔍 Script de diagnóstico de performance
// Pega esto en la consola del navegador (F12) cuando estés en la página de productos

console.log('🔍 Iniciando diagnóstico de performance...\n');

// 1. Verificar cuántos re-renders hay
let renderCount = 0;
const startTime = Date.now();

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      renderCount++;
      console.log(`⚡ Render #${renderCount}: ${entry.duration.toFixed(2)}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure'] });

// 2. Monitorear eventos de mouse
let hoverCount = 0;
let lastHoverTime = 0;

document.addEventListener('mouseover', (e) => {
  const now = Date.now();
  const timeSinceLastHover = now - lastHoverTime;
  
  if (e.target.closest('button')) {
    hoverCount++;
    console.log(`🖱️ Hover #${hoverCount} en botón (${timeSinceLastHover}ms desde último hover)`);
    
    // Medir tiempo de respuesta del hover
    const hoverStart = performance.now();
    requestAnimationFrame(() => {
      const hoverEnd = performance.now();
      const hoverTime = hoverEnd - hoverStart;
      
      if (hoverTime > 16) {
        console.warn(`⚠️ Hover lento: ${hoverTime.toFixed(2)}ms (debería ser <16ms para 60fps)`);
      } else {
        console.log(`✅ Hover rápido: ${hoverTime.toFixed(2)}ms`);
      }
    });
  }
  
  lastHoverTime = now;
});

// 3. Detectar re-renders de React
const originalConsoleLog = console.log;
let reactRenderCount = 0;

console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('render') || message.includes('Render')) {
    reactRenderCount++;
    console.warn(`🔄 React render detectado #${reactRenderCount}`);
  }
  originalConsoleLog.apply(console, args);
};

// 4. Monitorear uso de memoria
setInterval(() => {
  if (performance.memory) {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
    console.log(`💾 Memoria: ${used}MB / ${total}MB`);
  }
}, 5000);

// 5. Resumen después de 10 segundos
setTimeout(() => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n📊 RESUMEN DE PERFORMANCE:');
  console.log(`⏱️ Tiempo transcurrido: ${elapsed}s`);
  console.log(`⚡ Total de renders: ${renderCount}`);
  console.log(`🖱️ Total de hovers: ${hoverCount}`);
  console.log(`🔄 React renders: ${reactRenderCount}`);
  
  if (renderCount > 50) {
    console.error('❌ PROBLEMA: Demasiados renders! Debería ser <20 en 10 segundos');
  } else if (renderCount > 20) {
    console.warn('⚠️ ADVERTENCIA: Muchos renders. Debería ser <10 en 10 segundos');
  } else {
    console.log('✅ Performance OK');
  }
}, 10000);

console.log('\n✅ Diagnóstico iniciado. Pasa el mouse sobre los botones de productos...');
console.log('📊 Verás el resumen en 10 segundos\n');
