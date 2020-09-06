export interface IPluginConfig {
    skipTask: boolean;
    task: string;
    lintResultPath: string;
}
export declare function androidlint(config: IPluginConfig): Promise<void>;
