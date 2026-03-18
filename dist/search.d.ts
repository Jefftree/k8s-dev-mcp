import type { Config } from "./config.js";
interface SearchResult {
    file: string;
    line: string;
    text: string;
}
export declare function searchDocs(cfg: Config, query: string, repo: string, maxResults: number): SearchResult[];
export {};
