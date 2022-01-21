const Underdot = require('underdot')
    , sass = require('underdot-sass')
    , postcss = require('underdot-postcss')
    , autoprefixer = require('autoprefixer')
    , srcset = require('underdot-srcset')
    , ejs = require('underdot-ejs')
    , cname = require('underdot-cname')
    , bust = require('underdot-bust')
    , collection = require('underdot-collection')
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
    collection({
      name: 'projects',
      directory: 'projects',
    }),
    postcss([autoprefixer]),
    srcset({presets: srcsetPresets}),
    cname('lab43.com'),
    bust(),
  ]
});

underdot.build();
