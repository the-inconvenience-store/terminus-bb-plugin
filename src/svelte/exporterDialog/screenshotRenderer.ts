import * as fs from 'fs';
import * as path from 'path';
import { BlockbenchViewportOptions } from './types';

/**
 * Takes a screenshot of the current model in Blockbench
 * @param outputPath Path where the screenshot should be saved
 * @param viewportOptions Configuration for the viewport camera
 * @returns Promise that resolves when the screenshot is taken and saved
 */
export async function takeModelScreenshot(
    outputPath: string,
    viewportOptions: BlockbenchViewportOptions = getDefaultViewportOptions()
): Promise<string> {
    console.log('Taking screenshot using Screencam.NoAAPreview');
    console.log(`Screenshot will be saved to: ${outputPath}`);

    // Create a render viewport
    const render_viewport = Screencam.NoAAPreview;

    // Set up the viewport
    console.log('Setting up render viewport');
    render_viewport.resize(1080, 1080);

    // Apply camera preset
    render_viewport.loadAnglePreset(viewportOptions);

    // Set the focal length to 58
    console.log('Setting camera zoom');
    // if (render_viewport.isOrtho) {
    render_viewport.camera.zoom = 58 / 100;
    render_viewport.camera.updateProjectionMatrix();
    // }

    // Return a promise that resolves when the screenshot is saved
    return new Promise((resolve, reject) => {
        try {
            // Use Canvas.withoutGizmos to hide gizmos during the screenshot
            Canvas.withoutGizmos(() => {
                try {
                    // Render the scene
                    console.log('Rendering the scene');
                    render_viewport.render();

                    // Get the data URL and save it
                    console.log('Getting screenshot data URL');
                    const dataUrl = render_viewport.canvas.toDataURL();

                    console.log('Screenshot taken, processing data URL');

                    // Convert data URL to buffer and save
                    console.log('Converting screenshot to file');
                    const data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(data, 'base64');
                    fs.writeFileSync(outputPath, buffer);
                    console.log(`Screenshot saved to: ${outputPath}`);

                    resolve(outputPath);
                } catch (err) {
                    console.error('Error during screenshot capture:', err);
                    reject(err);
                }
            });
        } catch (err) {
            console.error('Error setting up screenshot:', err);
            reject(err);
        }
    });
}

/**
 * Returns the default viewport options for consistent screenshots
 */
export function getDefaultViewportOptions(): BlockbenchViewportOptions {
    return {
        id: 'isometric_right',
        projection: 'orthographic',
        position: [-40, 40, -40],
        target: [0, 0, 0],
        zoom: 0.7
    };
}