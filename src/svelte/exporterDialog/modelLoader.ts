import * as fs from 'fs';
import * as path from 'path';
import { ModelData } from './types';

/**
 * Loads a model into Blockbench and ensures it's selected
 * @param modelPath Path to the model file
 * @returns Promise that resolves when the model is loaded
 */
export async function loadModelFile(modelPath: string): Promise<any> {
    console.log(`Loading model from: ${modelPath}`);

    // Save the current project reference
    const currentProject = Project;

    // First save the current model if needed
    const savePromise = Project.saved ? Promise.resolve() : Project.save();

    return savePromise.then(() => {
        return new Promise((resolve, reject) => {
            try {
                // Read the file content
                console.log(`Reading model file content: ${modelPath}`);
                const modelFileContent = fs.readFileSync(modelPath, 'utf8');

                // Parse the JSON content
                let modelData: ModelData;
                try {
                    modelData = JSON.parse(modelFileContent);
                    console.log('Model file parsed successfully');
                } catch (err) {
                    console.error('Failed to parse model JSON:', err);
                    reject(new Error(`Failed to parse model file: ${err.message}`));
                    return;
                }

                // Get the project codec
                const projectCodec = Codecs.project || Object.values(Codecs).find(codec => codec.id === 'project');

                if (!projectCodec) {
                    reject(new Error('Project codec not found'));
                    return;
                }

                console.log('Loading the model with project codec');

                // Create a file object with path and name properties
                const fileObj = {
                    path: modelPath,
                    name: path.basename(modelPath)
                };

                try {
                    // Load the model using the project codec
                    console.log('Using project codec to load model...');
                    projectCodec.load(modelData, fileObj);

                    setTimeout(() => {
                        resolve(true);
                    }, 200);

                } catch (err) {
                    console.error('Error loading model:', err);
                    reject(err);
                }
            } catch (err) {
                console.error('Error preparing model load:', err);
                reject(err);
            }
        });
    });
}

/**
 * Restores the original project after exporting
 * @param originalProject The project to restore
 */
export function restoreProject(originalProject: any): void {
    if (originalProject) {
        console.log('Restoring original project');
        originalProject.select();
        console.log('Original project restored');
    }
}