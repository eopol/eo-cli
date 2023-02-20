export enum CHOICES_LIST_ENUM {
  project = 1,
  // 兼容后期低代码组件（物料）平台
  component,
}

export enum TEMPLATE_TYPE_ENUM {
  normal = 1,
  custom,
}

export interface Template {
  name: string
  ejsProjectName?: string
  npmName: string
  version: string
  ejsProjectVersion?: string
  type?: TEMPLATE_TYPE_ENUM
  installCommand: string
  // startCommand: string
}

export type Templates = Template[]

interface Project {
  templates: Templates
}

export const PROJECT: Project = {
  templates: [
    {
      name: 'vue3简单模版',
      npmName: '@eo-cli/simple-template',
      version: '1.0.3',
      type: 1,
      // installCommand: 'npm install pnpm -g && pnpm install -f',
      installCommand: 'pnpm install',
      // startCommand: 'pnpm dev',
    },
    {
      name: 'vue3复杂模版',
      npmName: '@eo-cli/complex-template',
      version: '1.0.3',
      type: 1,
      // installCommand: 'npm install pnpm -g && pnpm install -f',
      installCommand: 'pnpm install',
      // startCommand: 'pnpm dev',
    },
    // {
    //   name: 'vue3自定义模版',
    //   npmName: '@eo-cli/custom-template',
    //   version: '1.0.3',
    //   type: 2,
    //   // installCommand: 'npm install pnpm -g && pnpm install -f',
    //   installCommand: 'pnpm install',
    //   // startCommand: 'pnpm dev',
    // },
  ],
}

export const WHITE_PACKAGE_MANAGER = ['pnpm']
