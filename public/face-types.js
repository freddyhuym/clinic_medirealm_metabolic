(function () {
  'use strict';
  var printButton = document.getElementById('ftPrint');
  if (printButton) {
    printButton.addEventListener('click', function () {
      window.print();
    });
  }
})();