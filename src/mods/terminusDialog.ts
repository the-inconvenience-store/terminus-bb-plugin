import PACKAGE from '../../package.json'
import { createBlockbenchMod, createAction } from '../util/moddingTools'
import { openExporterDialog } from '../svelte/exporterDialog';

var action = createAction(`${PACKAGE.name}:open_export_dialog`, {
	icon: "icon-bb_interface",
	category: "tools",
	name: "Terminus",
	click: openExporterDialog
});

// TODO: >>
// get all bbmodel files in active directory
// open, check anchor_ points, ensure texture is base64 encoded
// create output folder
// create screenshot
// export gltf
// export .bbmodel

createBlockbenchMod(
	`${PACKAGE.name}:show_export_dialog`,
	{},
	() => {
		MenuBar.menus["tools"].structure.push(action);
	},
	() => {
		MenuBar.menus["tools"].structure = MenuBar.menus["tools"].structure.filter(
			// @ts-ignore
			(item) => item !== action
		);
	}
);