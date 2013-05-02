# Lab 43 Main Site


## To Do:

* remove unneeded stuff from modernizr
* look into best practices for loading Typekit
* The smooth scrolling code, in plugins.js, is a little hacked together. I had to change it so that empty anchor links ("#") would scroll to the top of the page. I should clean this up, package it as a jQuery plugin, and publish it to GitHub.


## Issues/Hacks:

* I added a shadow to #page and made sure that the shadow is immediately visible because apparently if an element isn't visible iOS doesn't render it. Without the shadow, you would start scrolling and it would take a second for #page to appear. This didn't have to be fixed with a shadow. I just had to make sure that some part of #page was always visible.
* Before, I simply put top:100% on #page so that it would sit just below the bottom of the window until scrolled into view. This didn't work in iOS. Top:100% seemed to include the entire page, not just the viewable area. I fixed this by using javascript to calculate the window height and add it to #page as inline style ( $('#page').css('top', $(window).height()) ). I then moved position:relative into a media query so that the inline top position would be ignored when the website is in a mobile state, this way I was able to avoid using !important in the css.