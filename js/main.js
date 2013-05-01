// load the theme style element
var themeSheet = document.getElementById("theme-sheet").sheet || document.getElementById("theme-sheet").styleSheet;

// update theme style element with new colors
function updateThemeColor(hue) {
  // if hsl ain't supported by your browser, you don't get interactive colors. This could be fixed by converting hsl to hex when hsla support isn't available. But do we really care that much about IE8?
  if (!Modernizr.hsla) return;
  var color = 'hsl(' + hue + ', 30%, 60%)';
  var hover = 'hsl(' + hue + ', 30%, 50%)';
  var rules = [
    '.theme-background {background-color: ' + color + ';}',
    '.theme-background-hover:hover {background-color: ' + hover + ';}',
    '.theme-border-dark { border-color: ' + hover + ';}',
    'h2, a { color: ' + color + ';}',
    'a:hover { color: ' + hover + ';}'
  ];
  for (var i = 0; i < rules.length; i++) {
    if (themeSheet.insertRule) {
      themeSheet.deleteRule(i);
      themeSheet.insertRule(rules[i], i);
    } else {
      // for ie
      themeSheet.deleteRule(i);
      themeSheet.addRule(rules[i], i);
    }
  }
}


// here comes the jQuery!
(function ($, undefined) {

  // initialize interactive masthead
  if (!Modernizr.touch) {
    $('#masthead, nav').mousemove(function (e) {
      var hue = Math.floor(e.pageX / $(window).width() * 256);
      updateThemeColor(hue);
    });
  }

  // mobile nav toggle functionality
  $('#nav .toggle').click(function (e) {
    e.preventDefault();
    $('#nav ul').toggle(100);
  });

  $('#nav a').click(function (e) {
    $('#nav ul').hide(100);
  });

  // show logo in nav when scrolled past masthead
  // this should probably be throttled, and disabled when nav is in mobile mode.
  $(window).scroll(function (e) {
    var pos = $(window).scrollTop();
    var point = $('#masthead').height();
    point -= $('#nav').height();
    if (pos >= point) {
      $('#nav').addClass('show-top-link');
    } else {
      $('#nav').removeClass('show-top-link');
    }
  });

})(jQuery);