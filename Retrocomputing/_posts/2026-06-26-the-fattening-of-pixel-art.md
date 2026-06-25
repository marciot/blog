---
assets: /assets/2026/06/26
css:
  - styles.css
scripts:
  - pixel-art.js
---

# The Great Fattening of Pixel Art

Despite the popularity of pixel art, modern web browsers have a flaw that have led to a rampant waste. Take this happy Macintosh icon I found on the web:

![](happy_mac.png){:.shadow}

In its original form, as designed by Susan Kare, this icon was 32×32 pixels. It was packed into a mere 128 bytes on disk and it looked sharp and beautiful. Today, this image of it weighs in at 18,271 bytes and is a bit blurry around the edges.

Search on the web for pixel art and you find plenty bloated by upscaling and then blurred by JPEG compression. Even after this, these images are much larger than they ought to be. I could not find a single icon that was exactly 32×32 pixels—all were engorged to several hundred pixels on a side!

## Why is this happening?


A 32×32 pixel icon such as ![](system.png) is far too small for today's displays, but when you try to upscale it using a browser's the `width` and `height` attributes, you will discover browsers provide only two upscaling choices:

- linear interpolation
- nearest-neighbor interpolation

Neither is satisfactory for pixel art: linear filtering blurs the image, while nearest-neighbor introduces inconsistent pixel sizes and shimmering during resizing.

CSS hints at solutions, but they are mostly dead ends: the `image-rendering` property offers `crisp-edges`, said to be "best for pixel art or line drawings," behaves identically to nearest-neighbor in every browser I tried; `pixelated` was either unsupported or behaved inconsistently.

## A possible solution

I was tipped off to a solution in the video [Crafting a Better Shader for Pixel Art Upscaling] by t3ssel8r, itself inspired by Cole Cecil's 2017 article [Scaling Pixel Art Without Destroying It].

The technique was originally intended for game engines, and SDL3 even includes `SDL_SCALEMODE_PIXELART`, but it got me wondering whether the same ideas could be brought to the web.

As a proof of concept I created a custom HTML element named `<pixel-art>`.

Below is a comparison between native images and the custom element.

<div class="resizable">

<img src="system.png">

<img src="system.png" class="pixelated">

<pixel-art src="system.png"></pixel-art>

<pixel-art src="system.png" fatbits></pixel-art>

</div>

Resize the container using the handle in the lower-right corner.

Pay particular attention to the middle two examples. They may appear similar initially, but the nearest-neighbor version exhibits shimmering and irregular pixel widths at certain scales. The custom element preserves crisp edges while maintaining consistent pixel geometry.

The final example recreates the classic Macintosh "fatbits" view.

<div class="resizable">

<pixel-art src="apple-mac.png" fatbits></pixel-art>
<pixel-art src="floppy.png"></pixel-art>
<pixel-art src="color-happy-mac.png"></pixel-art>
<pixel-art src="cursors.png" fatbits></pixel-art>
<pixel-art src="kare_steve_jobs_transparent.png" fatbits></pixel-art>
<pixel-art src="dogcow.png" fatbits></pixel-art>

</div>

Unlike pre-scaled PNGs, these source images occupy only a few hundred bytes on disk—much closer to how software shipped in the Macintosh era.

## Some things are best left to the imagination…

Having a custom element opens up some unthinkable possibilities beyond simple upscaling. For example, supplying ![](cross-stitch.png) as a texture transforms the pixel art into cross-stitch:

<div class="resizable huge">

<pixel-art
    src="apple-mac.png"
    texture="cross-stitch.png">
</pixel-art>

</div>

Were he still around to see it, Steve Jobs would have had a ![dogcow](dogcow.png) about this, something like this:

<div class="resizable huge">

<pixel-art
    src="kare_steve_jobs_transparent.png"
    texture="dogcow.png">
</pixel-art>

</div>

[Crafting a Better Shader for Pixel Art Upscaling]: https://www.youtube.com/watch?v=d6tp43wZqps&t=177s
[Scaling Pixel Art Without Destroying It]: https://colececil.dev/blog/2017/scaling-pixel-art-without-destroying-it