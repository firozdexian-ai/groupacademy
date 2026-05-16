import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES_WITH_PHONE, type CountryWithPhone } from "@/lib/constants/countries";

interface PhoneInputProps {
  value: string;
  countryCode: string; // Authoritative ISO Alpha-2 String Pointer (e.g., "US", "BD")
  onValueChange: (phone: string) => void;
  onCountryCodeChange: (phoneCode: string, countryIsoCode: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const POPULAR_ISO = ["BD", "IN", "AE", "SA", "US", "GB", "CA"];

/**
 * GroUp Academy: Technical Multi-National Communication Hub Terminal (PhoneInput)
 * Hardened composite combobox input sealing telephone route prefix state maps against ISO-2 index collisions.
 * Version: Launch Candidate · Phase Z0 Collision & Layout Shifting Hardened
 */
export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  placeholder = "Enter routing sequence",
  required = false,
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);

  // Phase 1: Force lookup passes against unique country code paths to shield state values from +1 routing splits
  const selectedCountry = React.useMemo(() => {
    return (
      COUNTRIES_WITH_PHONE.find((c) => c.code.toUpperCase() === countryCode.toUpperCase()) ||
      COUNTRIES_WITH_PHONE.find((c) => c.code.toUpperCase() === "BD") ||
      COUNTRIES_WITH_PHONE[0]
    );
  }, [countryCode]);

  const handleSelectCountry = React.useCallback(
    (country: CountryWithPhone) => {
      onCountryCodeChange(country.phoneCode, country.code);
      setOpen(false);
    },
    [onCountryCodeChange],
  );

  return (
    <div className={cn("flex items-center gap-2 w-full text-left antialiased transform-gpu select-none", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Toggle nation state dialing identification registry"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-[105px] h-10 px-2.5 rounded-lg border border-border/60 bg-background/50 hover:bg-accent hover:text-foreground focus:ring-1 focus:ring-ring shrink-0 flex items-center justify-between cursor-pointer gap-1.5 transition-colors",
            )}
          >
            <span className="flex items-center gap-1.5 truncate pointer-events-none">
              <span className="text-base leading-none block select-none mb-[-1px]">{selectedCountry.flag}</span>
              <span className="font-mono text-xs font-bold text-foreground/90 pt-0.5 leading-none">
                {selectedCountry.phoneCode}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/30 stroke-[2.2] shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[280px] p-0 rounded-xl border border-border/40 bg-popover/95 backdrop-blur-md shadow-md"
          align="start"
          sideOffset={6}
        >
          <Command className="bg-transparent w-full block">
            <CommandInput
              placeholder="Search registry index..."
              className="h-10 text-xs font-mono placeholder:font-normal placeholder:not-italic"
            />
            <CommandList className="max-h-[280px] p-1 w-full block scrollbar-thin">
              <CommandEmpty className="py-8 text-center font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/40">
                Registry tracking path void.
              </CommandEmpty>

              <CommandGroup heading="Priority Networks">
                {COUNTRIES_WITH_PHONE.filter((c) => POPULAR_ISO.includes(c.code.toUpperCase())).map((country) => (
                  <CountryItem
                    key={`priority-${country.code}`}
                    country={country}
                    active={countryCode.toUpperCase() === country.code.toUpperCase()}
                    onSelect={handleSelectCountry}
                  />
                ))}
              </CommandGroup>

              <CommandGroup heading="Global Handshake Registers">
                {COUNTRIES_WITH_PHONE.filter((c) => !POPULAR_ISO.includes(c.code.toUpperCase())).map((country) => (
                  <CountryItem
                    key={`global-${country.code}`}
                    country={country}
                    active={countryCode.toUpperCase() === country.code.toUpperCase()}
                    onSelect={handleSelectCountry}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ""))}
        className="flex-1 h-10 rounded-lg font-mono text-xs sm:text-sm font-bold tracking-wider select-text cursor-text tabular-nums text-foreground/90"
      />
    </div>
  );
}

/**
 * Internal Isolation Wrapper: Country Selection Node Item Row
 */
function CountryItem({
  country,
  active,
  onSelect,
}: {
  country: CountryWithPhone;
  active: boolean;
  onSelect: (c: CountryWithPhone) => void;
}) {
  return (
    <CommandItem
      value={`${country.name} ${country.phoneCode} ${country.code}`}
      onSelect={() => onSelect(country)}
      className={cn(
        "flex items-center rounded-lg px-2.5 py-1.5 transition-colors duration-100 cursor-pointer transform-gpu gap-2 w-full text-left text-xs font-bold text-foreground/80",
        "data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground",
      )}
    >
      <div className="flex h-4 w-4 items-center justify-center shrink-0 select-none pointer-events-none">
        {active ? (
          <Check className="h-3.5 w-3.5 stroke-[3px]" />
        ) : (
          <span className="text-base leading-none block mb-[-1px]">{country.flag}</span>
        )}
      </div>
      <span className="flex-1 truncate block pr-1 pt-0.5 uppercase tracking-tight font-sans text-[11px] font-semibold text-current">
        {country.name}
      </span>
      <span
        className={cn(
          "font-mono text-xs opacity-40 shrink-0 select-none text-right pt-0.5",
          active && "opacity-100 font-extrabold",
        )}
      >
        {country.phoneCode}
      </span>
    </CommandItem>
  );
}
