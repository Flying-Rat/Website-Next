export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uExplosion;
  uniform float uProximity;
  uniform float uBoost;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    float wave =
      sin(position.x * 4.2 + uTime * 1.1) *
      cos(position.y * 3.7 + uTime * 0.75) *
      sin(position.z * 3.1 + uTime * 0.55);
    wave += sin(position.x * 2.1 - uTime * 0.6) * 0.5;

    float explodeT = smoothstep(0.0, 1.0, uProximity);
    float waveAmp = uAmplitude * (0.2 + (1.0 - explodeT) * 0.4);
    float tremble = 1.0 + sin(uTime * 7.0) * 0.04 * explodeT;
    float explodeAmt = explodeT * uExplosion * tremble;

    float boost = smoothstep(0.0, 1.0, uBoost);
    float chaos = sin(position.x * 8.0 + uTime * 12.0) * sin(position.y * 7.0 + uTime * 9.0) * sin(position.z * 6.0 + uTime * 11.0);
    float chaosAmp = 0.25 * boost;

    vec3 displaced = position
      + normal * wave * waveAmp
      + normal * explodeAmt
      + normal * chaos * chaosAmp;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHoverColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uProximity;
  uniform float uEdgeGlow;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);

    float VdotN = abs(dot(viewDir, vNormal));
    float fresnel = (1.0 - VdotN) * (1.0 - VdotN);
    float breath = 0.92 + 0.08 * sin(uTime * 0.4);
    fresnel *= breath;

    float iridescenceT = VdotN * 0.5 + uTime * 0.05 + uProximity * 0.2;
    vec3 iridescence = cosinePalette(iridescenceT, 
                       vec3(0.5, 0.5, 0.5), 
                       vec3(0.5, 0.5, 0.5), 
                       vec3(1.0, 1.0, 1.0), 
                       vec3(0.0, 0.33, 0.67));
                       
    vec3 color = mix(uColor * 0.85, iridescence * 1.2 + uColor * 0.3, fresnel);
    color = mix(color, uHoverColor, uProximity * 0.8);

    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
    float diffuse = max(0.0, dot(vNormal, lightDir));
    float ndotl = clamp(dot(viewDir, -lightDir), 0.0, 1.0);
    float sss = ndotl * ndotl * 0.4;
    
    vec3 halfVec  = normalize(lightDir + viewDir);
    float spec    = pow(max(0.0, dot(vNormal, halfVec)), 60.0) * 0.5;
    
    color = color * (diffuse * 0.5 + 0.7 + sss) + spec * mix(uColor, vec3(1.0), 0.5);

    float explodeT = smoothstep(0.0, 1.0, uProximity);

    float innerGlow = (1.0 - fresnel) * explodeT * 0.3 * (1.0 - uEdgeGlow);
    color += uHoverColor * innerGlow;

    vec3 nDeriv = fwidth(vNormal);
    float edge = smoothstep(0.3, 0.7, length(nDeriv) * 8.0);
    color += (uHoverColor + vec3(0.5)) * edge * explodeT * 0.6 * uEdgeGlow;

    float fogDepth = length(vViewPosition);
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * fogDepth * fogDepth);
    color = mix(color, uFogColor, fogFactor);
    
    float alpha = uOpacity * (0.65 + fresnel * 0.45) * (1.0 - fogFactor * 0.6);

    vec2 pos = gl_FragCoord.xy;
    float dither = fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
    color += (dither - 0.5) / 255.0;

    gl_FragColor = vec4(color, alpha);
  }
`;
