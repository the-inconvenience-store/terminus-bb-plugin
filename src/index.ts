import * as PACKAGE from '../package.json'
import { events } from './util/events'
import './util/moddingTools'
import { openExporterDialog } from './svelte/exporterDialog'
//-------------------------------
// Import your source files here
//-------------------------------

// Mods
import './mods'



// Provide a global object for other plugins to interact with
// @ts-expect-error
window[PACKAGE.name] = {
	events: events,
	openExporterDialog,
}

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'create_session',
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: PACKAGE.tags as [string, string, string],
	onload() {
		events.LOAD.dispatch()
	},
	onunload() {
		events.UNLOAD.dispatch()
	},
	oninstall() {
		events.INSTALL.dispatch()
	},
	onuninstall() {
		events.UNINSTALL.dispatch()
	},
})
