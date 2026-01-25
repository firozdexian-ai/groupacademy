// Country constants for Study Abroad features and phone input
export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface CountryWithPhone extends Country {
  phoneCode: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
];

// Countries with phone codes for phone input component
export const COUNTRIES_WITH_PHONE: CountryWithPhone[] = [
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", phoneCode: "+880" },
  { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", phoneCode: "+966" },
  { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", phoneCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", phoneCode: "+33" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phoneCode: "+31" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", phoneCode: "+353" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", phoneCode: "+64" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", phoneCode: "+65" },
  { code: "JP", name: "Japan", flag: "🇯🇵", phoneCode: "+81" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", phoneCode: "+82" },
  { code: "CN", name: "China", flag: "🇨🇳", phoneCode: "+86" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", phoneCode: "+60" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", phoneCode: "+66" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", phoneCode: "+63" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", phoneCode: "+62" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", phoneCode: "+84" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", phoneCode: "+92" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", phoneCode: "+977" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", phoneCode: "+94" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", phoneCode: "+974" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", phoneCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", phoneCode: "+973" },
  { code: "OM", name: "Oman", flag: "🇴🇲", phoneCode: "+968" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phoneCode: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", phoneCode: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phoneCode: "+45" },
  { code: "FI", name: "Finland", flag: "🇫🇮", phoneCode: "+358" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", phoneCode: "+41" },
  { code: "AT", name: "Austria", flag: "🇦🇹", phoneCode: "+43" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", phoneCode: "+32" },
  { code: "IT", name: "Italy", flag: "🇮🇹", phoneCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", phoneCode: "+34" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phoneCode: "+351" },
  { code: "PL", name: "Poland", flag: "🇵🇱", phoneCode: "+48" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", phoneCode: "+420" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", phoneCode: "+36" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", phoneCode: "+27" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", phoneCode: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", phoneCode: "+254" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", phoneCode: "+20" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", phoneCode: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", phoneCode: "+52" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", phoneCode: "+90" },
  { code: "RU", name: "Russia", flag: "🇷🇺", phoneCode: "+7" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", phoneCode: "+380" },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((c) => c.code === code);
};

export const getCountryFlag = (code: string): string => {
  return getCountryByCode(code)?.flag || "🌍";
};

export const getCountryName = (code: string): string => {
  return getCountryByCode(code)?.name || code;
};

export const getCountryByPhoneCode = (phoneCode: string): CountryWithPhone | undefined => {
  return COUNTRIES_WITH_PHONE.find((c) => c.phoneCode === phoneCode);
};
