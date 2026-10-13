export const MAKES: Record<string, string[]> = {
  "Mercedes-Benz": ["S-Class", "E-Class", "Maybach S-Class", "G-Class", "GLE", "V-Class", "AMG GT"],
  "Rolls-Royce": ["Ghost", "Cullinan", "Phantom"],
  Bentley: ["Bentayga", "Flying Spur", "Continental GT"],
  "Range Rover": ["Autobiography", "SV", "Velar"],
  Porsche: ["911 Carrera", "Cayenne", "Panamera"],
  Cadillac: ["Escalade", "Escalade ESV"],
  Lexus: ["LX 600", "LM 350"],
  Toyota: ["Alphard"],
  BMW: ["7 Series", "X7", "8 Series"],
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Rwanda", "Côte d'Ivoire", "Senegal", "Egypt",
  "Morocco", "Tanzania", "Uganda", "Ethiopia", "Cameroon", "Angola",
];

export const TRANSMISSIONS = ["Automatic", "Manual"];
export const FUELS = ["Petrol", "Diesel", "Hybrid", "Electric"];
export const PHOTO_ID_TYPES = ["International passport", "Driver's licence", "National ID", "Voter's card"];

export function carName(make: string, model: string, year: number) {
  return `${make} ${model} (${year})`;
}
