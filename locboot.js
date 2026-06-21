/* Location-hero loader.
   Desktop: load the WebGL hero immediately.
   Mobile (<=900px): show a static poster and only load the 3D scene
   (and Three.js) when the visitor taps "View in 3D". Keeps phones light. */
const POSTER = window.matchMedia('(max-width:900px)').matches;
if (!POSTER) {
  import('/locationviz.js?v=5');
} else {
  document.querySelectorAll('.viz3d-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const host = btn.closest('.viz-panel, .glass-in');
      if (host) host.classList.add('viz-live');
      import('/locationviz.js?v=5');
    }, { once: true });
  });
}
