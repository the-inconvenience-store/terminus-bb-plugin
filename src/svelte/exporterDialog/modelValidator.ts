import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult, ModelData } from './types';

/**
 * Validates a BBModel file for Terminus export
 * @param modelData The parsed JSON data from the BBModel file
 * @param modelPath Path to the model file, used for texture resolution
 * @returns Validation results with errors and warnings
 */
export function validateModel(modelData: ModelData, modelPath: string): ValidationResult {
    console.log(`validateModel called for ${modelPath}`);
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Check for elements property
    if (!modelData.elements || !Array.isArray(modelData.elements)) {
        console.log('Model validation failed: No elements array');
        result.errors.push('Model has no elements array');
        result.valid = false;
        return result;
    }

    validateAnchorElements(modelData, result);
    validateTextures(modelData, modelPath, result);
    groundModel(modelData, result);

    console.log(`Model validation complete - Valid: ${result.valid}, Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    return result;
}

/**
 * Validates anchor elements in the model
 * Anchors must have matching from/to/origin coordinates
 */
function validateAnchorElements(modelData: ModelData, result: ValidationResult): void {
    // Check anchor elements
    const anchorElements = modelData.elements.filter(elem => elem.name && elem.name.startsWith('anchor_'));

    console.log(`Found ${anchorElements.length} anchor elements`);

    if (anchorElements.length === 0) {
        console.log('Warning: No anchor elements found');
        result.warnings.push('No anchor elements found (elements starting with "anchor_")');
    }

    // Validate that from, to, and origin are all equal for each anchor
    for (const anchor of anchorElements) {
        console.log(`Validating anchor: ${anchor.name}`);

        if (!anchor.from || !anchor.to || !anchor.origin) {
            console.log(`Error: Anchor "${anchor.name}" missing properties`);
            result.errors.push(`Anchor "${anchor.name}" is missing required properties (from, to, or origin)`);
            result.valid = false;
            continue;
        }

        // Check if from, to, and origin are all equal
        const fromStr = JSON.stringify(anchor.from);
        const toStr = JSON.stringify(anchor.to);
        const originStr = JSON.stringify(anchor.origin);

        console.log(`Anchor "${anchor.name}" coordinates - From: ${fromStr}, To: ${toStr}, Origin: ${originStr}`);

        if (fromStr !== toStr || fromStr !== originStr) {
            console.log(`Error: Anchor "${anchor.name}" has mismatched coordinates`);
            result.errors.push(
                `Anchor "${anchor.name}" has mismatched coordinates. ` +
                `From: [${anchor.from}], To: [${anchor.to}], Origin: [${anchor.origin}]. ` +
                'All coordinates must be identical.'
            );
            result.valid = false;
        }
    }
}

/**
 * Grounds the model by translating all elements so that the lowest Y coordinate is at Y=0
 * This affects from, to, and origin properties of all elements
 */
function groundModel(modelData: ModelData, result: ValidationResult): void {
    console.log('Grounding model to Y=0');

    if (!modelData.elements || modelData.elements.length === 0) {
        console.log('Cannot ground model: No elements found');
        return;
    }

    // Find the lowest Y coordinate across all elements (from, to, and origin points)
    let lowestY = Infinity;

    for (const element of modelData.elements) {
        if (element.from && Array.isArray(element.from) && element.from.length > 1) {
            lowestY = Math.min(lowestY, element.from[1]);
        }

        if (element.to && Array.isArray(element.to) && element.to.length > 1) {
            lowestY = Math.min(lowestY, element.to[1]);
        }

        if (element.origin && Array.isArray(element.origin) && element.origin.length > 1) {
            lowestY = Math.min(lowestY, element.origin[1]);
        }
    }

    if (lowestY === Infinity) {
        console.log('Cannot ground model: No valid Y coordinates found');
        return;
    }

    // If the model is already grounded (lowestY is 0), no need to translate
    if (lowestY === 0) {
        console.log('Model is already grounded (lowest Y = 0)');
        return;
    }

    console.log(`Translating model by Y offset of ${-lowestY} (lowest point was at Y=${lowestY})`);

    // Translate all elements
    for (const element of modelData.elements) {
        if (element.from && Array.isArray(element.from) && element.from.length > 1) {
            element.from[1] -= lowestY;
        }

        if (element.to && Array.isArray(element.to) && element.to.length > 1) {
            element.to[1] -= lowestY;
        }

        if (element.origin && Array.isArray(element.origin) && element.origin.length > 1) {
            element.origin[1] -= lowestY;
        }
    }

    result.warnings.push(`Model has been grounded - lowest point adjusted from Y=${lowestY} to Y=0`);
}

/**
 * Validates and optionally fixes textures in the model
 * Textures should be base64 encoded within the model
 */
function validateTextures(modelData: ModelData, modelPath: string, result: ValidationResult): void {
    // Check textures
    if (!modelData.textures || !Array.isArray(modelData.textures) || modelData.textures.length === 0) {
        console.log('Warning: Model has no textures');
        result.warnings.push('Model has no textures');
        return;
    }

    // Check for base64 encoded textures
    const texturesToFix = modelData.textures.filter(tex =>
        !tex.source || !tex.source.startsWith('data:image')
    );

    console.log(`Found ${texturesToFix.length} textures that need base64 encoding`);

    if (texturesToFix.length > 0) {
        // Process each texture that needs fixing
        for (const texture of texturesToFix) {
            try {
                console.log(`Processing texture: ${texture.name}`);
                // Try to get the texture file path
                let texturePath = '';

                if (texture.path) {
                    texturePath = texture.path;
                } else if (texture.relative_path) {
                    texturePath = path.resolve(path.dirname(modelPath), texture.relative_path);
                } else {
                    console.log(`Error: Texture "${texture.name}" has no valid path`);
                    result.errors.push(`Texture "${texture.name}" has no valid path`);
                    result.valid = false;
                    continue;
                }

                console.log(`Resolving texture path: ${texturePath}`);

                // Check if file exists
                if (!fs.existsSync(texturePath)) {
                    console.log(`Error: Texture file not found: ${texturePath}`);
                    result.errors.push(`Texture file not found: ${texturePath}`);
                    result.valid = false;
                    continue;
                }

                // Read and encode the texture
                console.log(`Reading texture file: ${texturePath}`);
                const textureData = fs.readFileSync(texturePath);
                const base64Data = `data:image/${path.extname(texturePath).substring(1)};base64,${textureData.toString('base64')}`;

                // Update the texture with base64 data
                console.log(`Successfully encoded texture "${texture.name}"`);
                texture.source = base64Data;
                result.warnings.push(`Encoded texture "${texture.name}" and saved to the model`);
            } catch (err) {
                console.error(`Failed to encode texture "${texture.name}":`, err);
                result.errors.push(`Failed to encode texture "${texture.name}": ${err.message}`);
                result.valid = false;
            }
        }
    }
}