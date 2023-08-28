import { settings } from "./Settings/settings";

export const propertyPickerStyle = settings.getString<"classic" | "batch">("propertyPicker.style");
