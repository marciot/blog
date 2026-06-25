---
assets: /assets/2016/04/17
---

# Let’s use style sheets for THREE.js elements, please!

The vast majority of THREE.js tutorials contain boilerplate code that assumes the WebGL content will be stretched across the entire window. These examples do not work at all when you try to position the WebGL canvas relative to other elements on the page.

A better approach is to start with code that works in all cases and then use the style sheet to stretch your content fit the entire window (if that is what you want). Doing it right from the start makes it easier to change your mind later and makes your code more flexible.

With this is mind, I am presenting two examples of how to do exactly that.

## Example 1: Full window THREE.js using CSS

The [first example](http://marciot.github.io/blog-demos/three-layout/margin.html) looks very much like your typical THREE.js program: it shows a WebGL canvas that spans the entire window. The only unusual thing is the pastel background and the white margin.

![margin](margin.png)

Let's walk through the [source code](https://github.com/marciot/blog-demos/tree/master/three-layout/margin.html) to see how it is done. First, I make the `body` tag to take up the entire window. Doing this requires [a trick](http://stackoverflow.com/questions/485827/css-100-height-with-padding-margin) where I peg each side of the `body` to the corresponding side of the browser window:

```css
body {
  position: absolute;
  top:      0;
  left:     0;
  right:    0;
  bottom:   0;
  margin:   3em;
}
```

Second, I set a margin of 3em units to create the white border around the page (you could remove this line if you don't want a border).

The `body` element is the parent of the `canvas` element; with CSS, it is easy to tell the `canvas` to use all the space available to it in the parent (which is the size of the window minus the margin):

```css
canvas {
  width: 100%;
  height: 100%;
}
```

Later on (I have separated the positioning and formatting into two separate style sheets), I assign a background color to the page and the `canvas`:

```css
html {
  background-color: white;
}

canvas {
  background-color: beige;
}
```

## Example 2a: Flowing text around WebGL content

The [second example](http://marciot.github.io/blog-demos/three-layout/wrap.html) shows text flowing dynamically around WebGL content. This example shows the true power of combining generically written THREE.js code with style sheets.

![wrap](wrap1.png)

To do this, I make a change to the [style sheet](https://github.com/marciot/blog-demos/blob/master/three-layout/wrap.html) to size and position the `canvas` element:

```css
canvas {
  float: left;
  width: 50%;
  height: 50%;
  margin-right: 2em;
  margin-bottom: 1em;
}
```

I set the `canvas` to be half the width and height of the parent and I tell it to float to the left of the surrounding text; the right and bottom margin control the space between the WebGL content and the text around it.

Provided the JavaScript is written correctly (as I will discuss below), going from one layout to another requires only a small change to the style sheet, as the following example shows.

## Example 2b: Interactive Zoom! You can have it both ways!

We can take things one step forward. Since the layout is now controlled directly by the style sheet, it only takes a couple extra CSS rules and a bit of JavaScript to give the user the ability to zoom in on the WebGL content:

```css
canvas.fullscreen {
  position: fixed;
  top:      0;
  left:     0;
  width:    100%;
  height:   100%;
}

canvas:hover {
  cursor:   zoom-in;
}

canvas.fullscreen:hover {
  cursor:   zoom-out;
}
```

The JavaScript code to toggle the state is equally trivial and could be made even easier if you were <a>using JQuery</a>:

```javascript
function toggleFullscreen() {
  var canvas = document.getElementById("webgl");
  if(canvas.className == "fullscreen") {
    canvas.removeAttribute("class");
  } else {
    canvas.setAttribute("class", "fullscreen");
  }
  onWindowResize();
}
```

For simplicity, `toggleFullscreen` assumes there is just one class, this code will [need adjustments](http://stackoverflow.com/questions/5169017/how-to-remove-class-attribute-from-div) if there are additional classes used on the canvas. The call to `onWindowResize` is necessary to adjust the parameters on the renderer.

## What makes it work?

Making these examples work requires some changes to the typical THREE.js setup code. Look at the improved [JavaScript code](http://marciot.github.io/blog-demos/three-layout/three-layout.js) to see these changes.

One key insight came from [rioki](http://www.rioki.org/2015/04/19/threejs-resize-and-canvas.html): rather than using the window's width and height, I use clientWidth and clientHeight; these are the exact dimension of the canvas element as rendered on the screen, after all CSS rules are applied.

```javascript
var canvas = document.getElementById("webgl");
camera = new THREE.PerspectiveCamera( 70, canvas.clientWidth / canvas.clientHeight, 1, 1000);
```

I also tell the renderer the specific canvas I want to use rather than letting it create a new one for me:

```javascript
renderer = new THREE.WebGLRenderer({alpha: true, canvas: canvas});
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
```

Setting the `alpha` to true allows me to set the background color of the canvas element from the style sheet; setting the canvas height and width to the clientWidth and clientHeight allows the resolution of the canvas to match the size of the canvas as it appears on the screen—these same values are passed on to the THREE.js renderer object.

The "onResize" handler updates everything when the browser window is resized, based on the *new* clientWidth and clientHeight values of the canvas:

```javascript
function onWindowResize() {
  var canvas = document.getElementById('webgl');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  render();
}
``` 