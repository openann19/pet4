/**
 * WebGL shaders for GPU-accelerated image filters
 */

export const DEFAULT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const FILTER_FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_temperature;
  uniform float u_tint;
  uniform float u_exposure;
  uniform float u_highlights;
  uniform float u_shadows;
  uniform float u_whites;
  uniform float u_blacks;
  uniform float u_clarity;
  uniform float u_vibrance;
  uniform float u_grain;
  uniform float u_vignette;
  uniform vec3 u_shadowTint;
  uniform vec3 u_midtoneTint;
  uniform vec3 u_highlightTint;
  
  varying vec2 v_texCoord;
  
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    
    // Brightness
    vec3 rgb = color.rgb + u_brightness;
    
    // Contrast
    rgb = ((rgb - 0.5) * (1.0 + u_contrast)) + 0.5;
    
    // Saturation
    float gray = dot(rgb, vec3(0.299, 0.587, 0.114));
    rgb = mix(vec3(gray), rgb, 1.0 + u_saturation);
    
    // Temperature (warm/cool)
    rgb.r += u_temperature * 0.1;
    rgb.b -= u_temperature * 0.1;
    
    // Tint (green/magenta)
    rgb.g += u_tint * 0.1;
    
    // Exposure
    rgb *= pow(2.0, u_exposure);
    
    // Highlights/Shadows
    float luminance = dot(rgb, vec3(0.299, 0.587, 0.114));
    if (luminance > 0.5) {
      rgb += (luminance - 0.5) * u_highlights;
    } else {
      rgb += (0.5 - luminance) * u_shadows;
    }
    
    // Whites/Blacks
    rgb = mix(vec3(0.0), rgb, 1.0 + u_blacks);
    rgb = mix(rgb, vec3(1.0), u_whites);
    
    // Color grading
    if (luminance < 0.33) {
      rgb += u_shadowTint * (1.0 - luminance / 0.33);
    } else if (luminance < 0.66) {
      rgb += u_midtoneTint;
    } else {
      rgb += u_highlightTint * ((luminance - 0.66) / 0.34);
    }
    
    // Vignette
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(v_texCoord, center);
    float vignetteFactor = 1.0 - smoothstep(0.3, 1.0, dist) * u_vignette;
    rgb *= vignetteFactor;
    
    // Grain
    float noise = rand(v_texCoord * u_resolution) * 2.0 - 1.0;
    rgb += noise * u_grain * 0.1;
    
    // Clamp to valid range
    rgb = clamp(rgb, 0.0, 1.0);
    
    gl_FragColor = vec4(rgb, color.a);
  }
`;

