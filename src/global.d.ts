/// <reference path="blockbenchTypeMods.d.ts" />

declare module '*.png' {
	const value: string
	export = value
}

declare module '*.svelte' {
	import { SvelteComponentTyped } from 'svelte';
	export default SvelteComponentTyped;
}