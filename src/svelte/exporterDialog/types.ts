// Types for the exporter
export interface BBModelFile {
    name: string;
    path: string;
    selected: boolean;
}

export interface ExportResult {
    model: string;
    status: 'success' | 'warning' | 'error';
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ModelData {
    elements: any[];
    textures: any[];
    [key: string]: any;
}

export type GltfExportOptions = {
    textures: boolean;
    archive: boolean;
    animation: boolean;
};