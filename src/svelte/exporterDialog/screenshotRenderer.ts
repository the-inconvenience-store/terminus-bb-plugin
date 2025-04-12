import * as fs from 'fs';
import * as path from 'path';

/**
 * Takes a screenshot of the current model in Blockbench
 * @param outputPath Path where the screenshot should be saved
 * @param viewportOptions Configuration for the viewport camera
 * @returns Promise that resolves when the screenshot is taken and saved
 */
export async function takeModelScreenshot(
    outputPath: string,
): Promise<string> {
    console.log(`Screenshot will be saved to: ${outputPath}`);

    // Return a promise that resolves when the screenshot is saved
    return new Promise((resolve, reject) => {
        try {
            // Use Canvas.withoutGizmos to hide gizmos during the screenshot
            Canvas.withoutGizmos(() => {
                try {
                    // Get the data URL and save it
                    console.log('Getting screenshot data URL');

                    const screenshotOptions: ScreenshotOptions = {};
                    Screencam.screenshotPreview(Preview.selected, screenshotOptions, (dataUrl) => {
                        console.log('Screenshot taken, processing data URL');

                        // Convert data URL to buffer and save
                        console.log('Converting screenshot to file');
                        const data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                        const buffer = Buffer.from(data, 'base64');
                        fs.writeFileSync(outputPath, buffer);
                        console.log(`Screenshot saved to: ${outputPath}`);

                        resolve(outputPath);

                    });

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
