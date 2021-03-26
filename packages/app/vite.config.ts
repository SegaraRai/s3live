import vue from '@vitejs/plugin-vue';
import { NodeTypes } from '@vue/compiler-core';
import camelCase from 'lodash.camelcase';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const cssModuleNmeMap = new Map<string, string>();
  return {
    build: {
      terserOptions: {
        mangle: {
          properties: {
            regex: /\$\$[qQ]$|^__cssModules$|^\$style$/,
          },
        },
      },
    },
    css: {
      modules: {
        localsConvention: ((
          className: string,
          _value: string,
          _inputFile: string
        ) => {
          return camelCase(className) + '$$q';
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        generateScopedName:
          mode === 'production'
            ? (name: string, filename: string, css: string): string => {
                const key = `${filename}\n${name}`;
                let result = cssModuleNmeMap.get(key);
                if (!result) {
                  result = `_${(cssModuleNmeMap.size + 10).toString(36)}`;
                  cssModuleNmeMap.set(key, result);
                }
                return result;
              }
            : '[name]__[local]___[hash:base64:5]',
      },
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            nodeTransforms: [
              (node): void => {
                // NOTE: `const enum` cannot be used in vite.config.ts
                switch (node.type) {
                  case NodeTypes.ELEMENT: {
                    const { props } = node;
                    for (const prop of props) {
                      switch (prop.type) {
                        case NodeTypes.ATTRIBUTE: {
                          switch (prop.name) {
                            case 'class':
                              // sort classes
                              const value = prop.value!;
                              value.content = value.content
                                .trim()
                                .split(/\s+/)
                                .sort()
                                .join(' ');
                              break;
                          }
                          break;
                        }
                      }
                    }
                    break;
                  }

                  case NodeTypes.TEXT:
                    node.content = node.content.trim();
                    break;
                }
              },
            ],
          },
        },
      }),
    ],
  };
});
