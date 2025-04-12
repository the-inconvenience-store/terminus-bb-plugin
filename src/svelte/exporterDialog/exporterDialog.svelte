<script lang="ts">
    // Project directory and model files passed from the dialog
    export let projectDirectory: string = ''
    export let modelFiles: {name: string, path: string, selected: boolean}[] = []
    
    // Import required utilities and types
    import type { ExportResult, ValidationResult } from './types';
    import { validateModel } from './modelValidator';
    import { loadModelFile } from './modelLoader';
    import { exportModelToGltf, getDefaultGltfOptions } from './gltfExporter';
    import { getDefaultViewportOptions, takeModelScreenshot } from './screenshotRenderer';

    let exportInProgress = false;
    let exportResults: ExportResult[] = [];
    
    // Toggle selection of all models
    let selectAll = false
    
    // Update selectAll when all models are manually selected
    $: {
        // Check if all models are selected and update selectAll accordingly
        if (modelFiles.length > 0) {
            selectAll = modelFiles.every(file => file.selected);
        }
    }
    
    function toggleSelectAll() {
        modelFiles.forEach(file => file.selected = selectAll)
        modelFiles = [...modelFiles] // Trigger reactivity
    }
    
    function toggleSelectModel(index: number) {
        modelFiles[index].selected = !modelFiles[index].selected
        modelFiles = [...modelFiles] // Trigger reactivity
        
        // Update selectAll based on current selections
        selectAll = modelFiles.every(file => file.selected)
    }

    $: selectedCount = modelFiles.filter(file => file.selected).length
    
    // Function to export selected models
    async function exportSelected() {
        if (selectedCount === 0 || exportInProgress) return;
        
        exportInProgress = true;
        exportResults = [];
        
        const selectedFiles = modelFiles.filter(file => file.selected);
        
        // Process each selected model
        for (const file of selectedFiles) {
            try {
                // Load the model file
                const modelData = await loadModelFile(file.path);
                
                if (!modelData) {
                    exportResults.push({
                        model: file.name,
                        status: 'error',
                        message: 'Failed to load model file'
                    });
                    continue;
                }
                
                // Validate the model
                const validationResult = validateModel(modelData, file.path);
                
                if (!validationResult.valid && validationResult.errors.length > 0) {
                    exportResults.push({
                        model: file.name,
                        status: 'error',
                        message: validationResult.errors.join(', ')
                    });
                    continue;
                }
				
				const screenshotPath = file.path.replace('.bbmodel', '.png');
                
				await takeModelScreenshot(screenshotPath, getDefaultViewportOptions());

				// Set up export path
                const outputPath = file.path.replace('.bbmodel', '.gltf');

                // Export the model to GLTF
                await exportModelToGltf(outputPath, getDefaultGltfOptions());
                
                // Record the export result
                if (validationResult.warnings.length > 0) {
                    exportResults.push({
                        model: file.name,
                        status: 'warning',
                        message: `Export successful with warnings: ${validationResult.warnings.join(', ')}`
                    });
                } else {
                    exportResults.push({
                        model: file.name,
                        status: 'success',
                        message: 'Export successful'
                    });
                }
            } catch (error) {
                exportResults.push({
                    model: file.name,
                    status: 'error',
                    message: `Export failed: ${error.message || 'Unknown error'}`
                });
            }
        }
        
        exportInProgress = false;
    }
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
    <div style="background-color: var(--color-back); border-radius: 4px; padding: 12px;">
        <h3>Project Directory</h3>
        <div style="font-family: monospace; word-break: break-all; padding: 6px; background-color: var(--color-button); border-radius: 4px;">
            {projectDirectory}
        </div>
    </div>
    
    <div style="background-color: var(--color-back); border-radius: 4px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3>Models ({modelFiles.length})</h3>
            <label style="display: flex; align-items: center; gap: 6px;">
                <input type="checkbox" bind:checked={selectAll} on:change={toggleSelectAll}>
                Select All
            </label>
        </div>
        
        {#if modelFiles.length === 0}
            <div style="padding: 12px; text-align: center; color: var(--color-text); font-style: italic;">
                No .bbmodel files found in the project directory
            </div>
        {:else}
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 4px; padding: 8px;">
                {#each modelFiles as file, i}
                    <div style="padding: 6px; border-bottom: 1px solid var(--color-border);">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input 
                                type="checkbox" 
                                checked={file.selected} 
                                on:change={() => toggleSelectModel(i)}
                            >
                            {file.name}
                        </label>
                    </div>
                {/each}
            </div>
            
            <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>Selected: {selectedCount} of {modelFiles.length}</div>
                <button 
                    on:click={exportSelected} 
                    disabled={selectedCount === 0 || exportInProgress}
                    style="padding: 6px 12px; background-color: var(--color-accent); color: var(--color-light); 
                           border: none; border-radius: 4px; cursor: pointer; 
                           opacity: {selectedCount === 0 || exportInProgress ? '0.5' : '1'}; 
                           cursor: {selectedCount === 0 || exportInProgress ? 'not-allowed' : 'pointer'};"
                >
                    {exportInProgress ? 'Exporting...' : 'Export Selected Models'}
                </button>
            </div>
        {/if}
    </div>

    {#if exportResults.length > 0}
        <div style="background-color: var(--color-back); border-radius: 4px; padding: 12px;">
            <h3>Export Results</h3>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 4px; padding: 8px;">
                {#each exportResults as result}
                    <div style="padding: 6px; border-bottom: 1px solid var(--color-border); 
                                color: {result.status === 'error' ? 'var(--color-error)' : 
                                        result.status === 'warning' ? 'var(--color-warning)' : 
                                        'var(--color-success)'};">
                        <strong>{result.model}:</strong> {result.message}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>