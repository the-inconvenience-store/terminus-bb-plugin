import PACKAGE from '../../package.json'
import { createBlockbenchMod, createAction } from '../util/moddingTools'
import { openExporterDialog } from '../svelte/exporterDialog';

var action = createAction(`${PACKAGE.name}:open_export_dialog`, {
	icon: "icon-bb_interface",
	category: "tools",
	name: "Open Terminus Exporter",
	click: openExporterDialog
});

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