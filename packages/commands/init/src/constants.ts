export const WHITE_PACKAGE_MANAGER = ['pnpm']

/** 命令行初始化类型 */
export enum CHOICES_LIST_ENUM {
  project = 'project',
  // 兼容后期低代码组件（物料）平台
  component = 'component',
}

/** 项目模版类型 */
export enum TEMPLATE_TYPE_ENUM {
  normal = 1,
  custom,
}

export interface Template {
  name: string
  npmName: string
  version: string
  type?: TEMPLATE_TYPE_ENUM
  installCommand: string
  // startCommand: string
  ejsName?: string
  ejsVersion?: string
  /** ejs 渲染需要忽略的文件 */
  ignore?: string[]
}

export type Templates = Template[]

export const PROJECT_LIST: Templates = [
  {
    name: 'vue3简单模版',
    npmName: '@eo-cli/simple-template',
    version: '1.0.4',
    type: 1,
    // installCommand: 'npm install pnpm -g && pnpm install -f',
    installCommand: 'pnpm install',
    // startCommand: 'pnpm dev',
    ignore: ['**/node_modules/**', '**/public/**'],
  },
  {
    name: 'vue3复杂模版',
    npmName: '@eo-cli/complex-template',
    version: '1.0.4',
    type: 1,
    // installCommand: 'npm install pnpm -g && pnpm install -f',
    installCommand: 'pnpm install',
    // startCommand: 'pnpm dev',
    ignore: ['**/node_modules/**', '**/public/**'],
  },
  // {
  //   name: 'vue3自定义模版',
  //   npmName: '@eo-cli/custom-template',
  //   version: '1.0.4',
  //   type: 2,
  //   // installCommand: 'npm install pnpm -g && pnpm install -f',
  //   installCommand: 'pnpm install',
  //   // startCommand: 'pnpm dev',
  //   ignore: ['**/node_modules/**', '**/public/**'],
  // },
]

export const COMPONENT_LIST: Templates = [
  {
    name: 'vue3组件库模版',
    npmName: '@eo-cli/components',
    version: '1.0.4',
    type: 1,
    // installCommand: 'npm install pnpm -g && pnpm install -f',
    installCommand: 'pnpm install',
    // startCommand: 'pnpm dev',
    ignore: ['**/node_modules/**', '**/public/**'],
  },
]
