'use strict';

let offset = 0;
setInterval(() => {
  offset = (offset + 1) % 360;
  document.documentElement.style.setProperty('--septa-color-offset', offset);
}, 35);
