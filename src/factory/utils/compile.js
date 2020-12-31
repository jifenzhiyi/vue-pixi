const colorParsChunk = [
  'attribute vec3 instanceColor;',
  'varying vec3 vInstanceColor;',
  '#include <common>',
].join('\n');

const instanceColorChunk = [
  '#include <begin_vertex>',
  '\tvInstanceColor = instanceColor;',
].join('\n');

const fragmentParsChunk = [
  'varying vec3 vInstanceColor;',
  '#include <common>',
].join('\n');

const colorChunk = [
  'vec4 diffuseColor = vec4( diffuse * vInstanceColor, opacity );',
].join('\n');

const onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', colorParsChunk)
    .replace('#include <begin_vertex>', instanceColorChunk);

  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', fragmentParsChunk)
    .replace('vec4 diffuseColor = vec4( diffuse, opacity );', colorChunk);
};

export default onBeforeCompile;
