import vue from '@vitejs/plugin-vue';
import { AttributeNode, TemplateNode, TextNode } from '@vue/compiler-core';
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
              (_node): void => {
                // NOTE: `const enum` cannot be used in vite.config.ts
                switch (_node.type) {
                  /** NodeTypes.ELEMENT */
                  case 1: {
                    const node = _node as TemplateNode;
                    const { props } = node;
                    for (const _prop of props) {
                      switch (_prop.type) {
                        /** NodeTypes.ATTRIBUTE */
                        case 6: {
                          switch (_prop.name) {
                            case 'class': {
                              // sort classes
                              const prop = _prop as AttributeNode;
                              const value = prop.value!;
                              value.content = value.content
                                .trim()
                                .split(/\s+/)
                                .sort()
                                .join(' ');
                              break;
                            }
                          }
                          break;
                        }
                      }
                    }
                    break;
                  }

                  /** NodeTypes.TEXT */
                  case 2: {
                    const node = _node as TextNode;
                    node.content = node.content.trim();
                    break;
                  }
                }
              },
            ],
          },
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'https://live-api.null.lu',
          changeOrigin: true,
          headers: {
            Origin: 'https://live.null.lu',
          },
        },
      },
    },
  };
});
