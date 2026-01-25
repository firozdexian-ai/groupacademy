import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES_WITH_PHONE, type CountryWithPhone } from "@/lib/constants/countries";

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (phone: string) => void;
  onCountryCodeChange: (code: string, country: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  placeholder = "Enter phone number",
  required = false,
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountry = COUNTRIES_WITH_PHONE.find(
    (c) => c.phoneCode === countryCode
  ) || COUNTRIES_WITH_PHONE[0];

  const handleSelectCountry = (country: CountryWithPhone) => {
    onCountryCodeChange(country.phoneCode, country.code);
    setOpen(false);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[110px] justify-between px-2 font-normal"
            disabled={disabled}
          >
            <span className="flex items-center gap-1 truncate">
              <span>{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.phoneCode}</span>
            </span>
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup heading="Popular">
                {COUNTRIES_WITH_PHONE.filter((c) =>
                  ["BD", "IN", "AE", "SA", "US", "GB", "CA"].includes(c.code)
                ).map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.phoneCode}`}
                    onSelect={() => handleSelectCountry(country)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        countryCode === country.phoneCode
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {country.phoneCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="All Countries">
                {COUNTRIES_WITH_PHONE.filter(
                  (c) =>
                    !["BD", "IN", "AE", "SA", "US", "GB", "CA"].includes(c.code)
                ).map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.phoneCode}`}
                    onSelect={() => handleSelectCountry(country)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        countryCode === country.phoneCode
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {country.phoneCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
