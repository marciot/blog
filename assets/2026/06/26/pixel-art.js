const vertexSource = `
attribute vec2 aPos;

varying vec2 vUV;

void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos,0.0,1.0);
}
`;

const basicShader = `
precision highp float;

uniform sampler2D uTex;
uniform vec2 uSrcSize;
uniform vec2 uDstSize;
uniform float uGridSize;

varying vec2 vUV;

// Returns 1.0 all points on the grid, 0.0 otherwise
// Thickness should be ~0.20 for a nice grid effect.
float gridLinesMask(vec2 locationWithinTexel, float thickness) {
  float distToEdge = min(min(locationWithinTexel.x, 1.0 - locationWithinTexel.x),
                         min(locationWithinTexel.y, 1.0 - locationWithinTexel.y));
  return smoothstep(0.0, thickness, distToEdge);
}

vec4 pixelArtSample(vec2 uv, float gridThickness) {
  vec2 pixelsPerTexels = uDstSize / uSrcSize;

  // scale uv by texture size to get texel coordinate
  vec2 textureCoords = uv * uSrcSize;

  // interpolation
  vec2 locationWithinTexel = fract(textureCoords);
  vec2 interpolationAmount = clamp( locationWithinTexel * pixelsPerTexels,                          vec2(0.0), vec2(0.5))
                           + clamp((locationWithinTexel - vec2(1.0)) * pixelsPerTexels + vec2(0.5), vec2(0.0), vec2(0.5));
  vec2 finalTextureCoords  = (floor(textureCoords) + interpolationAmount) / uSrcSize;
  vec4 color = texture2D(uTex, finalTextureCoords);

  if (gridThickness > 0.0) {
    // Compute grid lines
    float gridMask = gridLinesMask(locationWithinTexel, gridThickness);

    // Fade out grid as the spacing gets smaller, to avoid Moire patterns.
    // Note that gridFadeOut is 1.0 when the grid is invisible, 0.0 otherwise.
    float gridFadeOut = smoothstep(0.0, 1.0, 2.0 / pixelsPerTexels.x);

    return vec4(color.xyz, max(gridFadeOut, gridMask) * color.a);
  } else {
    return color;
  }
}

void main() {
  gl_FragColor = pixelArtSample(vUV, uGridSize);
}
`;

const textureShader = `
precision highp float;

uniform sampler2D uTex;
uniform sampler2D uPatternTex;

uniform vec2 uSrcSize;
uniform vec2 uDstSize;

varying vec2 vUV;

vec4 pixelArtSample(vec2 uv) {
  vec2 pixelsPerTexels = uDstSize / uSrcSize;

  vec2 textureCoords = uv * uSrcSize;

  vec2 locationWithinTexel = fract(textureCoords);

  vec2 interpolationAmount =
      clamp(locationWithinTexel * pixelsPerTexels,
            vec2(0.0), vec2(0.5))
    + clamp((locationWithinTexel - vec2(1.0)) * pixelsPerTexels + vec2(0.5),
            vec2(0.0), vec2(0.5));

  vec2 finalTextureCoords = (floor(textureCoords) + interpolationAmount) / uSrcSize;

  return texture2D(uTex, finalTextureCoords);
}

void main() {

  vec4 color = pixelArtSample(vUV);

  // Coordinate inside current source texel
  vec2 texelUV = fract(vUV * uSrcSize);

  // Tile pattern once per texel
  vec4 patternColor = texture2D(uPatternTex, texelUV);
  float pattern = patternColor.r;

  vec3 result = color.rgb;

  if (pattern < 0.5) {

    // black -> darker
    float darken = pattern * 2.0;
    result *= darken;

  } else {

    // white -> lighter
    float lighten = (pattern - 0.5) * 2.0;
    result = mix(result, vec3(1.0), lighten);
  }

  gl_FragColor = vec4(result, color.a * patternColor.a);
}
`;

class PixelArt extends HTMLElement {
  static get observedAttributes() {
    return ["src", "texture"];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.style.display = "inline-block";
    this.style.position = "relative";

    this.canvas = document.createElement("canvas");
    this.canvas.width  = 1;
    this.canvas.height = 1;
    this.canvas.style.height ='auto';
    this.canvas.style.width ='100%';
    this.canvas.style.display = "block";

    // Prevent downloading the upscaled image, instead we will allow
    // the user to download the source image, just like a real <img>
    // tag. This will be handled later in "loadImage".
    this._onContextMenu = e => e.preventDefault();
    this.canvas.addEventListener("contextmenu", this._onContextMenu);

    if (this.hasChildNodes()) {
      const hasRealChildren = Array.from(this.childNodes)
          .some(node => node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== "");

      if (hasRealChildren) {
        this.innerHTML = '<p style="color:red;">&#9888; pixel-art needs a closing tag &#9888;</p>';
        throw new Error(`<${this.tagName.toLowerCase()}> is likely missing a closing tag or has content.`);
      }
    }

    this.append(this.canvas);

    this.gl = null;
    this.program = null;
    this.texture = null;
    this.image = null;

    this.patternTexture = null;
    this.patternImage = null;

    this.resizeObserver = new ResizeObserver(() => {
        this.render();
    });

    this.initGL();

    this.resizeObserver.observe(this);

    const src = this.getAttribute("src");
    if (src) {
      this.loadImage(src);
    }

    const texture = this.getAttribute("texture");
    if (texture) {
      this.loadPattern(texture);
    }

    this.fatbits = this.hasAttribute("fatbits");
  }

  disconnectedCallback() {
    // Stop observing size changes
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Remove the canvas event listener (store the handler first in connectedCallback)
    if (this._onContextMenu) {
      this.canvas?.removeEventListener("contextmenu", this._onContextMenu);
    }

    // Delete WebGL resources
    if (this.gl) {
      const gl = this.gl;

      if (this.texture) {
        gl.deleteTexture(this.texture);
        this.texture = null;
      }

      if (this.patternTexture) {
        gl.deleteTexture(this.patternTexture);
        this.patternTexture = null;
      }

      if (this.buffer) {
        gl.deleteBuffer(this.buffer);
        this.buffer = null;
      }

      if (this.program) {
        const shaders = gl.getAttachedShaders(this.program);
        if (shaders) {
          for (const shader of shaders) {
            gl.detachShader(this.program, shader);
            gl.deleteShader(shader);
          }
        }

        gl.deleteProgram(this.program);
        this.program = null;
      }

      // Optional: lose the context if the element is permanently removed
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();

      this.gl = null;
    }

    // Release image references
    this.image = null;
    this.patternImage = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (name === "src" && oldValue !== newValue) {
        this.loadImage(newValue);
      }
  }

  createShader(type, source) {
      const gl = this.gl;

      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }

      return shader;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;

    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  initGL() {
    this.gl =
      this.canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false
      });

    if (!this.gl) {
      throw new Error("WebGL not supported");
    }

    const gl = this.gl;

    this.program = this.createProgram(
      vertexSource,
      this.hasAttribute("texture") ? textureShader : basicShader
    );

    gl.useProgram(this.program);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      vertices,
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(this.program, "aPos");

    gl.enableVertexAttribArray(aPos);

    gl.vertexAttribPointer(
      aPos,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    this.uTex      = gl.getUniformLocation(this.program, "uTex");
    this.uSrcSize  = gl.getUniformLocation(this.program, "uSrcSize");
    this.uDstSize  = gl.getUniformLocation(this.program, "uDstSize");
    this.uGridSize = gl.getUniformLocation(this.program, "uGridSize");

    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.LINEAR
    );

    gl.uniform1i(this.uTex, 0);

    if (this.hasAttribute("texture")) {
      this.patternTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      this.uPatternTex = gl.getUniformLocation(this.program, "uPatternTex");
      gl.uniform1i(this.uPatternTex, 1);
    }
  }

  async loadImage(src) {
    if (!src || !this.gl) {
      return;
    }

    const img = new Image();

    img.crossOrigin = "anonymous";

    function getBaseUrl() {
      const base = document.querySelector('base');      
      return base ? base.getAttribute('href') : '';
    }
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => {this.innerHTML='<img src="#">'; reject();}
      img.src = getBaseUrl() + src;
    });

    this.image = img;

    this.canvas.width  = this.image.naturalWidth;
    this.canvas.height = this.image.naturalHeight;

    const style = getComputedStyle(this);
    if (style.aspectRatio === "auto") {
      this.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    }

    const gl = this.gl;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      img
    );

    this.render();

    // Create a fully transparent overlay image, so if the user
    // right-clicks they can save the source image, rather than
    // the upscaled one.

    this.style.position = "relative";
    this.overlayImg = document.createElement("img");
    this.overlayImg.src = src;
    this.overlayImg.style.position = "absolute";
    this.overlayImg.style.top = "0";
    this.overlayImg.style.left = "0";
    this.overlayImg.style.width = "100%";
    this.overlayImg.style.height = "100%";
    this.overlayImg.style.opacity = "0";
    this.append(this.overlayImg);
  }

  async loadPattern(src) {
    if (!src || !this.gl) return;

    const img = new Image();

    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });

    this.patternImage = img;

    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      img
    );

    this.render();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.getBoundingClientRect();

    const width  = Math.max(1, Math.round(rect.width  * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (
      this.canvas.width !== width ||
      this.canvas.height !== height
    ) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    return { width, height };
  }

  render() {
    if (!this.gl || !this.image) {
      return;
    }

    const gl = this.gl;
    const dst = this.resizeCanvas();

    gl.viewport(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    gl.useProgram(this.program);

    gl.uniform2f(
      this.uSrcSize,
      this.image.width,
      this.image.height
    );

    gl.uniform2f(
      this.uDstSize,
      dst.width,
      dst.height
    );

    gl.uniform1f(
      this.uGridSize,
      this.fatbits ? 0.25 : 0.0
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    if (this.patternTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

customElements.define("pixel-art", PixelArt);