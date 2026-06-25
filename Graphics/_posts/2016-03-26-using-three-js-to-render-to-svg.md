---
assets: /assets/2016/03/26
---

# Using THREE.JS to render to SVG

I came across a blog post that demonstrates [using THREE.js to create SVG images](http://blog.felixbreuer.net/2014/08/05/using-threejs-to-create-vector-graphics-from-3d-visualizations.html). Since that demo was done in CoffeeScript, it took me a while to understand it and build an equivalent JavaScript [demo](http://marciot.github.io/blog-demos/three-to-svg/) (and the [source code](https://github.com/marciot/blog-demos/tree/master/three-to-svg)).

The SVGRenderer is undocumented in the THREE.js website and it requires a few extra files that are not a part of the standard THREE.js distribution. This post will help you pull the necessary parts together.

My demo is loosly based on this [great THREE.js tutorial](http://solutiondesign.com/blog/-/blogs/webgl-and-three-js-texture-mappi-1/). I modified it to show the WebGL output on the left-hand side and the SVG capture on the right-hand side. Clicking the arrow updates the SVG capture and shows the code for the SVG on the bottom of the page.

When you hover your mouse cursor over the right-hand side, the paths of the SVG will highlight in red. These correspond to triangles in the original THREE.js model.

![three-to-svg](three-to-svg.png?w=300){: class="centered"}

The nice thing about rendering THREE.js models as SVG is that the visible faces will become `path` elements in the DOM, allowing you to highlight them with a single style sheet rule:

```css
path:hover {
  stroke: red;
  stroke-width: 2px;
}
```

This rule tells the web browser to stroke all `path` elements in a solid red line whenever the user hovers the mouse cursor over them.

## How it works:

The demo uses the undocumented SVGRenderer object from THREE.js. The `SVGRenderer` object depends on another object called `Projector`. Neither are part of the official THREE.js build, so I grabbed the two source files from the "examples/js/renderer" directory of the THREE.js distribution from [GitHub](https://github.com/mrdoob/three.js/tree/master/examples/js/renderers) and placed them in my "lib" directory.

When the user clicks the arrow, the SVG on the right side is updated using a new instance of the SVGRenderer object. Here is what the code looks like:

```javascipt
var svgRenderer = new THREE.SVGRenderer();
svgRenderer.setClearColor(0xffffff);
svgRenderer.setSize(width,height);
svgRenderer.setQuality('high');
svgRenderer.render(scene,camera);
```

The SVGRenderer will store the SVG data in the `domElement` attribute of itself. In the following code fragment, I insert it into a parent DIV and remove the `width` and `height` attributes from the `svg` element so that I can scale it with style sheet rules.

```javascript
svgContainer.appendChild(svgRenderer.domElement);
svgRenderer.domElement.removeAttribute('width');
svgRenderer.domElement.removeAttribute('height');
```

The SVG source for the bottom panel comes from the `svgContainer.innerHTML` attribute (`domElement.outerHTML` would work too). I use a regular expression to break up the source into lines and then post it into the destination text field:

```javascipt
document.getElementById('source').value = svgContainer.innerHTML.replace(/<path/g, "\n<path");
```
