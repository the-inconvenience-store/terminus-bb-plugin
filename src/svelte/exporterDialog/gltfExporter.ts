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
    const gltfCodec = Codecs.gltf;

    if (!gltfCodec) {
        throw new Error('GLTF codec not found');
    }

    return new Promise((resolve, reject) => {
        // Make sure the model is fully loaded and rendered before export
        Canvas.updateAll();

        // Give Blockbench a moment to finish any pending operations
        setTimeout(async () => {
            console.log('Compiling GLTF content');
            try {
                // Force internal Blockbench updates before compiling
                Blockbench.dispatchEvent('update_view');
                Canvas.updateAll();

                // Make sure the output directory exists
                const outputDir = path.dirname(outputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Compile the GLTF
                try {
                    const content = await gltfCodec.compile(options);

                    // Validate the compiled content
                    if (!content) {
                        throw new Error('GLTF compilation returned empty content');
                    }

                    console.log('GLTF compiled successfully, writing to file');
                    await gltfCodec.write(content as Buffer, outputPath);

                    // Verify the file was created
                    if (!fs.existsSync(outputPath)) {
                        throw new Error('GLTF file was not created');
                    }

                    console.log('GLTF export complete:', outputPath);
                    resolve(outputPath);
                } catch (err) {
                    console.error('GLTF compilation error:', err);
                    reject(err);
                }
            } catch (err) {
                console.error('GLTF export setup error:', err);
                reject(err);
            }
        }, 300);
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