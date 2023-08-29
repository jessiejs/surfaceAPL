import { settings } from "./Settings/settings";

export let propertyPickerStyle = settings.getString<"classic" | "batch">("propertyPicker.style");

settings.bind<string>("propertyPicker.style", (value) => {
	propertyPickerStyle = value as "classic" | "batch";
})
