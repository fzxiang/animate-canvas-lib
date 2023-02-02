import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path'
import glob from 'glob';
import { fileURLToPath } from 'url';

// import typescript from "@rollup/plugin-typescript";

const DIR_DIST = path.resolve('dist')

const mods = glob.sync('./src/**/*.js').map(file => [
	// This remove `src/` as well as the file extension from each
	// file, so e.g. src/nested/foo.js becomes nested/foo
	path.relative(
		'src',
		file.slice(0, file.length - path.extname(file).length)
	),
	// This expands the relative paths to absolute paths, so e.g.
	// src/nested/foo becomes /project/src/nested/foo.js
	fileURLToPath(new URL(file, import.meta.url))
])

const config = mods.map(([modName, modPath]) => {
	return {
		input: modPath,
		external: ['three'],
		globals: {
			three: 'THREE',
		},
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs(), // so Rollup can convert `ms` to an ES module
		],
		output: ['umd', 'es', 'cjs'].map(mod => {
			return {
				name: '__animation__',
				dir: DIR_DIST,
				format: mod,
				paths: {
					three: 'https://cdn.jsdelivr.net/npm/three@0.86.0/build/three.min.js',
				},
				entryFileNames: `[name].${mod}.js`,
			}
		})
	}
})
export default config
