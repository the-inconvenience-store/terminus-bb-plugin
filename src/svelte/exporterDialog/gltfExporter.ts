import * as fs from 'fs';
import * as path from 'path';
import { GltfExportOptions } from './types';

/**
 * Exports the current Blockbench model to GLTF format
 * @param outputPath Path where the GLTF file should be saved
 * @param options GLTF export options
 * @returns Promise that resolves when the GLTF export is completed
 */
export async function exportModelToGltf(
    outputPath: string,
    options: GltfExportOptions = getDefaultGltfOptions()
): Promise<string> {
    console.log('Preparing GLTF export');
    console.log(`GLTF will be exported to: ${outputPath}`);

    // Find the GLTF codec
    const gltfCodec = Codecs.gltf || Object.values(Codecs).find(codec => codec.id === 'gltf');

    if (!gltfCodec) {
        throw new Error('GLTF codec not found');
    }

    return new Promise((resolve, reject) => {
        console.log('Compiling GLTF content');
        try {
            // Wait for the GLTF compilation Promise to resolve
            gltfCodec.compile(options)
                .then(gltfContent => {
                    // Save GLTF content
                    console.log(`Writing GLTF to: ${outputPath}`);
                    fs.writeFileSync(outputPath, gltfContent);
                    console.log('GLTF file written successfully');
                    resolve(outputPath);
                })
                .catch(err => {
                    console.error('GLTF compilation error:', err);
                    reject(err);
                });
        } catch (err) {
            console.error('GLTF export setup error:', err);
            reject(err);
        }
    });
}

/**
 * Returns the default GLTF export options
 */
export function getDefaultGltfOptions(): GltfExportOptions {
    return {
        textures: true,
        archive: false,
        animation: true
    };
}