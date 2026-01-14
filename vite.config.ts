import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// Check if we're building the UMD bundle
const isUMDBuild = process.env.BUILD_UMD === 'true';

// UMD build configuration (for CDN distribution)
const umdConfig = defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cdn.ts'),
      name: 'CyberCharts',
      formats: ['umd'],
      fileName: () => 'cybercore-charts.umd.js',
    },
    rollupOptions: {
      output: {
        exports: 'default',
        // Ensure the global name is CyberCharts
        name: 'CyberCharts',
        // No external dependencies for UMD - bundle everything
      },
    },
    outDir: 'dist',
    emptyDir: false, // Don't clean dist since we build multiple times
    sourcemap: true,
    minify: false,
    target: 'ES2020', // Wider browser support for UMD
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@charts': resolve(__dirname, './src/charts'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
});

// Minified UMD build configuration
const umdMinConfig = defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cdn.ts'),
      name: 'CyberCharts',
      formats: ['umd'],
      fileName: () => 'cybercore-charts.umd.min.js',
    },
    rollupOptions: {
      output: {
        exports: 'default',
        name: 'CyberCharts',
      },
    },
    outDir: 'dist',
    emptyDir: false,
    sourcemap: true,
    minify: 'esbuild',
    target: 'ES2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@charts': resolve(__dirname, './src/charts'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
});

// Main library build configuration (ESM + CJS)
const mainConfig = defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
      },
      name: 'CybercoreCharts',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        if (entryName === 'index') {
          if (format === 'es') {
            return 'cybercore-charts.esm.js';
          }
          return 'cybercore-charts.js';
        }
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        preserveModules: false,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'ES2022',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@charts': resolve(__dirname, './src/charts'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
});

// Export the appropriate config based on build type
export default (() => {
  if (process.env.BUILD_UMD === 'true') {
    return umdConfig;
  }
  if (process.env.BUILD_UMD_MIN === 'true') {
    return umdMinConfig;
  }
  return mainConfig;
})();
