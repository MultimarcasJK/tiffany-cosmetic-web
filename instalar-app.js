// Convierte la tienda en app instalable (Android, PC y iPhone).
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker no registrado:', e));
    });
  }

  const yaInstalada =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (yaInstalada) return;

  const boton = document.getElementById('installAppBtn');
  const avisoIos = document.getElementById('iosInstallHint');

  // Android y PC (Chrome, Edge, Samsung Internet): el navegador avisa que se puede instalar.
  let pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pedidoInstalar = e;
    if (boton) boton.classList.remove('hidden');
  });

  if (boton) {
    boton.addEventListener('click', async () => {
      if (!pedidoInstalar) return;
      pedidoInstalar.prompt();
      await pedidoInstalar.userChoice;
      pedidoInstalar = null;
      boton.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    if (boton) boton.classList.add('hidden');
  });

  // iPhone/iPad: Safari no tiene boton de instalar, se explica como hacerlo a mano.
  const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let avisoCerrado = false;
  try { avisoCerrado = localStorage.getItem('tiffany_aviso_ios_cerrado') === '1'; } catch (e) {}

  if (esIos && avisoIos && !avisoCerrado) {
    setTimeout(() => avisoIos.classList.remove('hidden'), 2500);
    const cerrar = document.getElementById('iosInstallHintClose');
    if (cerrar) {
      cerrar.addEventListener('click', () => {
        avisoIos.classList.add('hidden');
        try { localStorage.setItem('tiffany_aviso_ios_cerrado', '1'); } catch (e) {}
      });
    }
  }
})();
