declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*?url' {
  const content: string;
  export default content;
}
declare module '*.css' {
  const content: unknown;
  export default content;
}
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
declare module '*.yaml' {
  const content: any;
  export default content;
}
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

declare const YAML: typeof import('yaml');

declare const z: typeof import('zod');
declare namespace z {
  export type infer<T> = import('zod').infer<T>;
  export type input<T> = import('zod').input<T>;
  export type output<T> = import('zod').output<T>;
}

declare module 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js' {
  export function registerMvuSchema(
    schema: z.ZodType<Record<string, any>> | (() => z.ZodType<Record<string, any>>),
  ): void;
}

/**
 * 兼容酒馆助手声明文件使用的旧式全局 TypeFest 命名空间。
 *
 * type-fest v4 以 ES 类型模块导出；这里仅建立类型别名，
 * 不会生成 JavaScript，也不会改变浏览器运行时。
 */
declare namespace TypeFest {
  type LiteralUnion<
    LiteralType,
    BaseType extends import('type-fest').Primitive = string,
  > = import('type-fest').LiteralUnion<LiteralType, BaseType>;

  type PartialDeep<
    T,
    Options extends import('type-fest').PartialDeepOptions = {},
  > = import('type-fest').PartialDeep<T, Options>;

  type SetRequired<BaseType, Keys extends keyof BaseType> = import('type-fest').SetRequired<BaseType, Keys>;
}
