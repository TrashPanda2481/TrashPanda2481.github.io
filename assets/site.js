/* Meridian — progressive enhancement only. Site is fully usable without JS. */
(function () {
  "use strict";

  // Scroll reveal. The `.js` class (set inline in <head>) gates the hidden
  // initial state, so no-JS visitors always see content.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = document.querySelectorAll(".reveal");

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  reveals.forEach(function (el) { io.observe(el); });
})();
