import stringify from 'fast-json-stable-stringify'
import * as esbuild from 'esbuild'

interface ApolloPlaygroundPluginFunctionMode {
  init?: () => Promise<any> | void
  preRequest?: (request, linkProperties) => Promise<any> | void
}

type PluginBuildOptions = Exclude<Partial<esbuild.BuildOptions>, 'write' | 'outdir' | 'format'>;

interface ApolloPlaygroundPluginFileMode {
  filePath: string
  buildOptions?: PluginBuildOptions
}

const cache = {}

export type ApolloPlaygroundPlugin = ApolloPlaygroundPluginFunctionMode | ApolloPlaygroundPluginFileMode

export function processPluginFile (
  pluginFilePath: string,
  buildOptions: PluginBuildOptions = {}
) {
  const cacheString = `${pluginFilePath}${stringify(buildOptions)}`
  if (cache[cacheString]) {
    return cache[cacheString]
  }
  const build = esbuild.buildSync({
    entryPoints: [pluginFilePath],
    target: 'es2015',
    bundle: true,
    write: false,
    outdir: 'out',
    format: 'esm',
    ...buildOptions
  })
  if (build && build.errors && build.errors.length > 0) {
    build.errors.forEach(console.error);
    throw new Error('Compilation failed.')
  }
  const outputFile = build?.outputFiles?.[0]?.text
  if (!outputFile || outputFile.length === 0) {
    throw new Error('No output file found or output file is empty.')
  }
  const encodedJs = `data:text/javascript;charset=utf-8,${encodeURIComponent(outputFile)}`
  cache[cacheString] = encodedJs
  return encodedJs
}
