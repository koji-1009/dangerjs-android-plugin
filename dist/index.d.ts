export declare class PluginConfig {
    skipTask: boolean;
    task: string;
    lintResultPath: string;
}
export declare function androidlint(config?: PluginConfig): Promise<void>;
