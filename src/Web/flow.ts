import alert from "./IO/alert";
import confirm from "./IO/confirm";
import select from "./IO/select";
import { settings } from "./Settings/settings";

export async function setupFlow() {
	let isAsking = true

	while (isAsking) {
		await alert(`Let's help you get into your flow.`);

		await alert(`Link shortening can make your QR codes smaller and your links more portable.\nThe only potential reason you wouldn\'t want to use this is that your level will be stored on the servers on gotiny.cc`);
	
		let allowLinkShortening = await confirm('Would you like to enable link shortening?');
	
		let propPickType:string | undefined = undefined;
	
		while (!propPickType) {
			const selection = await select('Property Picker Type', [
				{
					text: 'Classic',
					isThereMore: true,
				},
				{
					text: 'Modern',
					isThereMore: true,
				}
			]);
	
			if (selection == 'Classic') {
				if (await confirm('The Classic Property Picker style lets you edit data simply, just select the pencil tool and click on your tile.\nAre you sure you want to use this style?')) {
					propPickType = 'classic';
				}
			}
			if (selection == 'Modern') {
				if (await confirm('The Modern Property Picker style lets you edit data like a pro, copy the data of something with the scissors tool, edit it with the pencil, and then paste it with the paste tool.\nAre you sure you want to use this style?')) {
					propPickType = 'batch';
				}
			}
		}

		if (await confirm(`Let's make sure all you're settings are how you want them\n\nLink shortening: ${allowLinkShortening ? 'On' : 'Off'}\nProperty Picker Style: ${propPickType}\n\nAre these how you want them?`)) {
			settings.setPref('privacy.linkShortener', allowLinkShortening);
			settings.setPref('propertyPicker.style', propPickType);
			isAsking = false;
		}
	}
}
