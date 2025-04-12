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

                    // Give the model time to fully initialize before continuing
                    // Use a timeout to ensure the model is fully loaded into Blockbench
                    setTimeout(() => {
                        // Find the newly loaded ModelProject and select it
                        const loadedProject = ModelProject.all.find(project =>
                            project.save_path === modelPath ||
                            project.name === path.basename(modelPath, '.bbmodel')
                        );

                        if (!loadedProject) {
                            console.error('Could not find loaded project');
                            reject(new Error('Failed to find loaded project'));
                            return;
                        }

                        console.log('Found loaded project:', loadedProject.name);
                        loadedProject.select();
                        console.log('Model selected successfully');

                        // Wait for any pending Blockbench operations to complete
                        // Force a UI update to ensure the model is rendered
                        Blockbench.dispatchEvent('update_view');
                        Canvas.updateAll();

                        // Additional delay to ensure everything is fully loaded
                        setTimeout(() => {
                            resolve(loadedProject);
                        }, 200);
                    }, 300);
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