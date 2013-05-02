# Lab 43


## To Do:

* remove unneeded stuff from modernizr
* look into best practices for loading Typekit
* The smooth scrolling code, in plugins.js, is a little hacked together. I had to change it so that empty anchor links ("#") would scroll to the top of the page. I should clean this up, package it as a jQuery plugin, and publish it to GitHub.


## Issues:

I added a shadow to #page and made sure that the shadow is immediately visible because apparently if an element isn't visible iOS doesn't render it. Without the shadow, you would start scrolling and it would take a second for #page to appear. This didn't have to be fixed with a shadow. I just had to make sure that some part of #page was always visible