import type { Config } from "./config.js";
interface FeatureGate {
    name: string;
}
export interface KepMeta {
    title: string;
    kepNumber: number;
    status: string;
    owningSig: string;
    stage: string;
    latestMilestone: string;
    featureGates: FeatureGate[];
    dir: string;
}
export declare function buildKepIndex(cfg: Config): {
    index: KepMeta[];
    repoPath: string;
};
export declare function filterKeps(keps: KepMeta[], sig: string, status: string, query: string): KepMeta[];
export declare function formatKepLine(k: KepMeta): string;
export declare function readKepREADME(repoPath: string, kep: KepMeta): string;
export declare function readKepYAML(repoPath: string, kep: KepMeta): string;
export {};
