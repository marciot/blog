---
assets: /assets/2016/03/24
---

# Could textures be used in 3D Printing?

Real world objects have surface texture. In computer graphics, real world materials are simulated by combining bitmapped textures with facet information. Bump maps or displacement maps add fine details to a surface without increasing the polygon count.

![cube](cube.png){: class="floatLeft"}

3D printing software today does not use textures at all: a model of brick wall, for example, requires many very small polygons to capture details.

One reason is that 3D slicers use STL files which cannot carry texture information. There are several other formats that do, however, so using another file format such as OBJ would solve this problem. A second reason may be that 3D printing happens layer by layer, making it difficult to perform a displacement for all surface orientations.

For vertical surfaces, it would be easy: the slicer would use texture values to displace the print head laterally, perpendicular to the wall contours. For horizontal surfaces, however, the displacement would be above or below the current layer, which would complicate things.

In future posts, I'll continue to explore the possibility of using textures in 3D printing and will present some work I am doing towards that end.