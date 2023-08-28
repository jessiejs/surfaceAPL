import createDialog from '../IO/dialog';
import copy from '../IO/copy';
import confirm from '../IO/confirm';
import alert from '../IO/alert';
import prompt from '../IO/prompt';

export function openDialogTestMenu() {
	createDialog('Dialog test menu', {
		buttons: [
			{
				text: 'Alert',
				onclick: async () => {
					await alert('Alert!');
				},
			},
			{
				text: 'Confirm',
				onclick: async () => {
					if (await confirm('Yes?')) {
						await alert('Yas!');
					} else {
						await alert('No!');
					}
				},
			},
			{
				text: 'Copy',
				onclick: async () => {
					await copy('Download a gamer', 'gamer');
				},
			},
			{
				text: 'Prompt',
				onclick: async () => {
					const text = await prompt(
						'What is your name?',
						'Andreas Kling',
						{
							validateFunction(text: string) {
								if (text.length < 3) {
									return 'Name must be at least 3 characters long';
								}
							},
						}
					);
					await alert(text);
				},
			},
			{
				text: 'Cancel',
				close: true,
			},
		],
	});
}
