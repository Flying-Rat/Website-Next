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

  vec3 hueShift(vec3 c, float shift) {
    float cosA = cos(shift);
    float sinA = sin(shift);
    return c * cosA +
           cross(vec3(0.57735), c) * sinA +
           vec3(0.57735) * dot(vec3(0.57735), c) * (1.0 - cosA);
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
    float breath = 0.92 + 0.08 * sin(uTime * 0.4);
    fresnel *= breath;

    float hueAngle = fresnel * 0.6 + uTime * 0.08;
    vec3 rimColor = hueShift(uColor + vec3(0.35), hueAngle);

    vec3 color = mix(uColor * 0.65, rimColor, fresnel);
    color = mix(color, uHoverColor, uProximity);

    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
    float diffuse = max(0.0, dot(vNormal, lightDir)) * 0.35 + 0.65;
    vec3 halfVec  = normalize(lightDir + viewDir);
    float spec    = pow(max(0.0, dot(vNormal, halfVec)), 40.0) * 0.28;
    color = color * diffuse + spec * (uColor * 0.5 + 0.35);

    float explodeT = smoothstep(0.0, 1.0, uProximity);

    float innerGlow = (1.0 - fresnel) * explodeT * 0.22 * (1.0 - uEdgeGlow);
    color += uHoverColor * innerGlow;

    vec3 nDeriv = fwidth(vNormal);
    float edge = smoothstep(0.3, 0.7, length(nDeriv) * 8.0);
    color += uHoverColor * edge * explodeT * 0.6 * uEdgeGlow;

    float fogDepth = length(vViewPosition);
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * fogDepth * fogDepth);
    color = mix(color, uFogColor, fogFactor);
    float alpha = uOpacity * (0.45 + fresnel * 0.55) * (1.0 - fogFactor * 0.6);

    gl_FragColor = vec4(color, alpha);
  }
`;
