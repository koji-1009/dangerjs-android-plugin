export default async function android(config: IPluginConfig): Promise<void>

export interface IPluginConfig {
    skipTask: boolean
    task: string
    lintResultPath: string
}
