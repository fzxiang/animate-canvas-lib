import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import typescript from "@rollup/plugin-typescript";

const DIR_DIST = "dist/animate-canvas-lib"

const outputConfigs = {
	'esm-bundler': {
		file: 
	}
}
// const defalutFormats
// const packageConfigs = 
export default {
	input: './src/plane.js',
	plugins:[
		resolve(), // so Rollup can find `ms`
		commonjs(), // so Rollup can convert `ms` to an ES module
		// typescript(),
	],
	external: ['three'],
	globals: {
		three: 'THREE',
	},

	output: [
		{
			name: 'plane',
			file: DIR_DIST + ".umd.js",
			format: 'umd',
			paths: {
				three: 'https://cdn.jsdelivr.net/npm/three@0.86.0/build/three.min.js',
			},
		},
		{ file: DIR_DIST + ".cjs.js", format: 'cjs' },
		{ file: DIR_DIST + ".esm.js", format: 'es' }
	]
}
