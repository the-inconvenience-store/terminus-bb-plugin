// Export all types and functionality from the exporter modules
export * from './types';
export * from './modelValidator';
export * from './screenshotRenderer';
export * from './gltfExporter';
export * from './modelLoader';

import { SvelteDialog } from '../../util/svelteDialog';
import ExporterDialog from './exporterDialog.svelte';
import * as fs from 'fs';
import * as path from 'path';
import type { BBModelFile } from './types';

/**
 * Finds all .bbmodel files in a directory
 * @param directory The directory to search for .bbmodel files
 * @returns Array of BBModelFile objects
 */
function findBBModelFiles(directory: string): BBModelFile[] {
    if (!directory) return [];
    
    try {
        return fs.readdirSync(directory)
            .filter(file => file.endsWith('.bbmodel'))
            .map(file => ({
                name: file,
                path: path.join(directory, file),
                selected: false
            }));
    } catch (err) {
        console.error('Failed to read directory for bbmodel files:', err);
        return [];
    }
}

/**
 * Get the current working directory where models should be found
 * This follows the model_variant_generator plugin's approach
 * @returns The current working directory or empty string if not found
 */
function getCurrentProjectDirectory(): string {
    // Try to get the directory from the current project's save or export path
    let projectDirectory = '';
    
    // First check if we have Project.save_path which is most reliable
    if (Project?.save_path) {
        projectDirectory = path.dirname(Project.save_path);
    } 
    // Then try Project.export_path as fallback
    else if (Project?.export_path) {
        projectDirectory = path.dirname(Project.export_path);
    }
    // If we still don't have a path, use a different approach
    else if (Project) {
        // Check if any models are open via ModelProject.all
        const openProjects = ModelProject.all.filter(p => p.save_path || p.export_path);
        if (openProjects.length > 0) {
            // Use the first open project that has a path
            const projectWithPath = openProjects.find(p => p.save_path || p.export_path);
            if (projectWithPath) {
                projectDirectory = path.dirname(projectWithPath.save_path || projectWithPath.export_path);
            }
        }
    }
    
    return projectDirectory;
}

// Export the function to open the exporter dialog
export function openExporterDialog() {
    // Find the current project directory using the more robust method
    const projectDirectory = getCurrentProjectDirectory();
    
    if (!projectDirectory) {
        Blockbench.showMessageBox({
            title: 'Terminus Exporter',
            message: 'Please save your project before exporting models. The exporter needs a project directory to work with.',
            icon: 'error'
        });
        return;
    }
    
    // Find all .bbmodel files in the project directory
    const modelFiles = findBBModelFiles(projectDirectory);
    
    // Create and show the dialog
    new SvelteDialog({
        id: `terminus:terminus_exporter`,
        title: 'Terminus Exporter',
        width: 600,
        component: ExporterDialog,
        props: {
            projectDirectory,
            modelFiles
        }
    }).show();
}