export interface RepoConfig {
    url: string;
    sparse?: string[];
}
export interface DocConfig {
    repo: string;
    path: string;
    description: string;
}
export interface Config {
    repos: Record<string, RepoConfig>;
    docs: Record<string, DocConfig>;
}
export declare function loadConfig(): Config;
