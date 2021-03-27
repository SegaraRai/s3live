import vue from '@vitejs/plugin-vue';
import { AttributeNode, TemplateNode, TextNode } from '@vue/compiler-core';
import camelCase from 'lodash.camelcase';
import { defineConfig } from 'vite';

function createReservedMangleProps(): Record<string, string> {
  // reserve prop names which starts with '$' or '_'
  const chars = [
    ...'$_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    '',
  ];
  const entries: [string, string][] = [];
  for (const c0 of '$_') {
    for (const c1 of chars) {
      for (const c2 of chars) {
        for (const c3 of chars) {
          const name = `${c0}${c1}${c2}${c3}`;
          entries.push([`$${name}`, name]);
        }
      }
    }
  }
  return Object.fromEntries(entries);
}

export default defineConfig(({ mode }) => {
  let refCounter = 10;
  const cssModuleNmeMap = new Map<string, string>();
  const nameCache = {
    /*
    vars: {
      props: {},
    },
    //*/
    props: {
      props: {
        $__cssModules: 'Zc',
        $$style: 'Zs',
        ...createReservedMangleProps(),
      },
    },
  };
  return {
    build: {
      terserOptions: {
        mangle: {
          properties: {
            regex: /\$\$[qQ]$|^__cssModules$|^\$style$/,
          },
        },
        nameCache,
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

                            case 'ref': {
                              // mangle refs
                              const prop = _prop as AttributeNode;
                              const value = prop.value!;
                              if (/\$\$[qQ]$/.test(value.content)) {
                                if (
                                  !nameCache.props.props[`$${value.content}`]
                                ) {
                                  nameCache.props.props[
                                    `$${value.content}`
                                  ] = `Y${(refCounter++).toString(36)}`;
                                }
                                value.content =
                                  nameCache.props.props[`$${value.content}`];
                              }
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
