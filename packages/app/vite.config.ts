import type { AttributeNode, ElementNode, TextNode } from '@vue/compiler-core';
import type {
  SFCAsyncStyleCompileOptions,
  SFCStyleCompileResults,
  compileStyleAsync,
} from '@vue/compiler-sfc';
import camelCase from 'lodash.camelcase';
import type { Plugin } from 'rollup';
import type { Options, terser } from 'rollup-plugin-terser';
import type { UserConfig } from 'vite';

// https://github.com/vitejs/vite/issues/512
const isProd = process.env.NODE_ENV === 'production';

// mangle properties
if (isProd) {
  // NOTE: using `import` statement will result in infinite recursion
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const orgTerser = require('rollup-plugin-terser').terser as typeof terser;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('rollup-plugin-terser').terser = function terser(
    userOptions: Options = {}
  ): Plugin {
    //console.log(userOptions);

    const newUserOptions: Options = {
      ...userOptions,
      mangle: {
        properties: {
          regex: /\$\$[qQ]$|^__cssModules$|^\$style$/,
        },
      },
    };

    return orgTerser.call(this, newUserOptions);
  };
}

// mangle CSS Modules class names
{
  const nameMap = new Map<string, string>();

  // NOTE: using `import` statement will result in infinite recursion
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const orgCompileStyleAsync = require('@vue/compiler-sfc')
    .compileStyleAsync as typeof compileStyleAsync;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@vue/compiler-sfc').compileStyleAsync = function compileStyleAsync(
    options: SFCAsyncStyleCompileOptions
  ): Promise<SFCStyleCompileResults> {
    //console.log(options);

    const orgGenerateScopedName = options.modulesOptions.generateScopedName;

    const newOptions: SFCAsyncStyleCompileOptions = {
      ...options,
      modulesOptions: {
        ...options.modulesOptions,
        localsConvention: ((
          className: string,
          _value: string,
          _inputFile: string
        ) => {
          //console.log(className, _value, _inputFile);

          return camelCase(className) + '$$q';
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        generateScopedName: (
          name: string,
          filename: string,
          css: string
        ): string => {
          //console.log(name, filename, _css);

          const key = `${filename}\n${name}`;

          let result = nameMap.get(key);
          if (!result) {
            result = `_${(nameMap.size + 10).toString(36)}`;
            if (!isProd) {
              result =
                typeof orgGenerateScopedName === 'string'
                  ? `${orgGenerateScopedName.replace(
                      /\[local\]/g,
                      name
                    )}_${result}`
                  : orgGenerateScopedName(name, filename, css);
            }
            //*/
            nameMap.set(key, result);
          }

          return result;
        },
      },
    };

    return orgCompileStyleAsync.call(this, newOptions);
  };
}

function is<T>(value: T) {
  return value;
}

export default is<UserConfig>({
  vueCompilerOptions: {
    nodeTransforms: [
      (node): void => {
        // NOTE: `const enum` cannot be used in vite.config.ts
        switch (node.type) {
          // NodeTypes.ELEMENT
          case 1: {
            const { props } = node as ElementNode;
            for (const prop of props) {
              switch (prop.type) {
                // NodeTypes.ATTRIBUTE
                case 6: {
                  switch ((prop as AttributeNode).name) {
                    case 'class':
                      // sort classes
                      (prop as AttributeNode).value.content = (prop as AttributeNode).value.content
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

          // NodeTypes.TEXT
          case 2:
            (node as TextNode).content = (node as TextNode).content.trim();
            break;
        }
      },
    ],
  },
});
