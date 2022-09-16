const Underdot = require('underdot')
    , sass = require('underdot-sass')
    , postcss = require('underdot-postcss')
    , autoprefixer = require('autoprefixer')
    , srcset = require('underdot-srcset')
    , ejs = require('underdot-ejs')
    , cname = require('underdot-cname')
    , bust = require('underdot-bust')
    , svgo = require('underdot-svgo')
;



const srcsetPresets = {
  full: {
    sizes: '100vw',
    srcset: [2200, 1900, 1600, 1300, 1000, 700],
  },
}


const underdot = new Underdot({
  destination: 'docs', // required by Github pages
  globals: {
    siteTitle: 'Lab 43 | Web Design and Development',
  },
  plugins: [
    ejs({
      views: ['source/_includes'],
    }),
    sass({
      sourceMap: true,
      outputStyle: 'expanded',
    }),
    postcss([autoprefixer]),
    srcset({presets: srcsetPresets}),
    cname('lab43.com'),
    bust(),
    svgo({
      plugins: [
        {inlineStyles:  false}, // so we can avoid !important in our css
        {removeViewBox: false}, // allow css resizing https://css-tricks.com/scale-svg/
        {prefixIds:     true }, // prevent styles from one svg affecting another
        {removeTitle:   false}, // improve accessibility by not remove <title> tags
      ],
    }),
  ]
});

underdot.build();
