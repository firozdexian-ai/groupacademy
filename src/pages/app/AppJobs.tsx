import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchPublicActiveJobs } from "@/domains/jobs/repo/jobsRepo";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Briefcase, X, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE } from "@/lib/uiTokens";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface JobWithSalary extends JobCardData {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
}

const SKELETON_ITEMS = [1, 2, 3, 4];
const PAGE_SIZE_CAP = 50;

/**
 * GroUp Academy: Authoritative Placement Opportunities Directory (AppJobs)
 * Hardened clean SaaS filter interface shielding search parameters from recursive URL cascades and stabilizing currency conversions.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function AppJobs() {
  const navigateHook = useNavigate();
  const [urlSearchParamsMap, setUrlSearchParamsMap] = useSearchParams();
  const { isSaved: checkIsJobSaved, toggleSave: triggerToggleSaveMutation } = useSavedItems();

  const [textSearchQueryInput, setTextSearchQueryInput] = React.useState<string>(
    urlSearchParamsMap.get("search") || "",
  );
  const [debouncedSearchQueryStr, setDebouncedSearchQueryStr] = React.useState<string>(
    urlSearchParamsMap.get("search") || "",
  );

  const [selectedJobTypesArray, setSelectedJobTypesArray] = React.useState<string[]>(() => {
    const rawTypeParam = urlSearchParamsMap.get("type");
    return rawTypeParam ? [rawTypeParam] : [];
  });

  const [selectedExpLevelsArray, setSelectedExpLevelsArray] = React.useState<string[]>([]);
  const [minimumSalaryValueInt, setMinimumSalaryValueInt] = React.useState<number>(0);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState<boolean>(false);

  const [jobsRegistryPayload, setJobsRegistryPayload] = React.useState<JobWithSalary[]>([]);
  const [isDataLayerLoading, setIsDataLayerLoading] = React.useState<boolean>(true);
  const [isPaginationLoadingMore, setIsPaginationLoadingMore] = React.useState<boolean>(false);
  const [currentPageIndexInt, setCurrentPageIndexInt] = React.useState<number>(0);
  const [hasMoreRecordsAvailable, setHasMoreRecordsAvailable] = React.useState<boolean>(true);

  const targetCompanyContextStr = urlSearchParamsMap.get("company");
  const targetLocationContextStr = urlSearchParamsMap.get("location");
  const sortOrderContextStr = urlSearchParamsMap.get("sort") || "newest";

  // =========================================================================
  // LIFECYCLE SECTOR 1: INSULATED TEXT SEARCH INPUT DEBOUNCE TRACK
  // =========================================================================
  React.useEffect(() => {
    const schedulingTimerToken = setTimeout(() => {
      setDebouncedSearchQueryStr(textSearchQueryInput);

      // Update URL parameters dynamically without causing context loop crashes
      const adaptiveParamsBuffer = new URLSearchParams(window.location.search);
      if (textSearchQueryInput.trim()) {
        adaptiveParamsBuffer.set("search", textSearchQueryInput.trim());
      } else {
        adaptiveParamsBuffer.delete("search");
      }
      setUrlSearchParamsMap(adaptiveParamsBuffer, { replace: true });
    }, 300);

    return () => clearTimeout(schedulingTimerToken);
  }, [textSearchQueryInput, setUrlSearchParamsMap]);

  // =========================================================================
  // LIFECYCLE SECTOR 2: AUTHORITATIVE SELECTION DIRECTORY COMPILER HOOKS
  // =========================================================================
  const fetchMarketplaceJobsInventory = React.useCallback(
    async (targetPageNum: number = 0, isAppendSequenceFlag: boolean = false) => {
      const isThreadMountedFlag = { current: true };

      if (!isAppendSequenceFlag) {
        setIsDataLayerLoading(true);
      } else {
        setIsPaginationLoadingMore(true);
      }

      try {
        const offsetRangeFromInt = targetPageNum * PAGE_SIZE_CAP;
        const offsetRangeToInt = offsetRangeFromInt + PAGE_SIZE_CAP - 1;

        const fetchOutputPayload = await searchPublicActiveJobs(
          {
            company: targetCompanyContextStr ?? null,
            location: targetLocationContextStr ?? null,
            search: debouncedSearchQueryStr ?? null,
            jobTypes: selectedJobTypesArray,
            sort: sortOrderContextStr === "hot" ? "hot" : sortOrderContextStr === "expiring" ? "expiring" : null,
          },
          offsetRangeFromInt,
          offsetRangeToInt,
        );

        if (!isThreadMountedFlag.current) return;

        const convertedJobsPayload = (fetchOutputPayload as unknown as JobWithSalary[]) || [];
        setHasMoreRecordsAvailable(convertedJobsPayload.length === PAGE_SIZE_CAP);

        setJobsRegistryPayload((previousCacheArray) =>
          isAppendSequenceFlag ? [...previousCacheArray, ...convertedJobsPayload] : convertedJobsPayload,
        );
        setCurrentPageIndexInt(targetPageNum);
      } catch (fatalQueryExceptionPayload) {
        console.error("Database Lookup Handshake Aborted:", fatalQueryExceptionPayload);
      } finally {
        if (isThreadMountedFlag.current) {
          setIsDataLayerLoading(false);
          setIsPaginationLoadingMore(false);
        }
      }
    },
    [
      targetCompanyContextStr,
      targetLocationContextStr,
      sortOrderContextStr,
      debouncedSearchQueryStr,
      selectedJobTypesArray,
    ],
  );

  React.useEffect(() => {
    fetchMarketplaceJobsInventory(0, false);
  }, [fetchMarketplaceJobsInventory]);

  // =========================================================================
  // LIFECYCLE SECTOR 3: MEMOIZED PARAMETER COMBINATOR FILTERS
  // =========================================================================
  const processedFilteredJobsList = React.useMemo<JobWithSalary[]>(() => {
    return jobsRegistryPayload.filter((jobItemNode) => {
      const normalizedExpLevelStr = jobItemNode.experience_level?.replace("_level", "") || jobItemNode.experience_level;
      const matchExperienceFlag =
        selectedExpLevelsArray.length === 0 ||
        selectedExpLevelsArray.some((levelTokenStr) => levelTokenStr.replace("_level", "") === normalizedExpLevelStr);

      let matchSalaryThresholdFlag = true;
      if (minimumSalaryValueInt > 0 && jobItemNode.salary_range_max) {
        const structuralThresholdInUsd = minimumSalaryValueInt * 1000;
        const jobMaxCeilingInUsd =
          jobItemNode.salary_currency === "BDT" ? jobItemNode.salary_range_max / 110 : jobItemNode.salary_range_max;
        matchSalaryThresholdFlag = jobMaxCeilingInUsd >= structuralThresholdInUsd;
      }

      const matchLocationScopeFlag =
        targetLocationContextStr !== "abroad" ||
        ["remote", "international", "abroad", "overseas"].some((termKey) =>
          jobItemNode.location?.toLowerCase().includes(termKey),
        ) ||
        jobItemNode.job_type === "remote";

      return matchExperienceFlag && matchSalaryThresholdFlag && matchLocationScopeFlag;
    });
  }, [jobsRegistryPayload, selectedExpLevelsArray, minimumSalaryValueInt, targetLocationContextStr]);

  const handleClearAllFiltersAction = React.useCallback(() => {
    setTextSearchQueryInput("");
    setSelectedJobTypesArray([]);
    setSelectedExpLevelsArray([]);
    setMinimumSalaryValueInt(0);
    setUrlSearchParamsMap(new URLSearchParams(), { replace: true });
  }, [setUrlSearchParamsMap]);

  const handleReturnToHubRedirect = React.useCallback(() => {
    navigateHook("/app/jobs");
  }, [navigateHook]);

  const activeSalaryFiltersCounterInt = minimumSalaryValueInt > 0 ? 1 : 0;
  const compositeActiveFiltersCounterInt =
    selectedJobTypesArray.length + selectedExpLevelsArray.length + activeSalaryFiltersCounterInt;

  return (
    <div
      className={cn(PAGE_SHELL_WIDE, "max-w-4xl mx-auto space-y-6 text-left antialiased block transform-gpu w-full")}
    >
      {/* HUD LEVEL 1: APP SHELL WORKSPACE HIERARCHY NAVIGATION BAR */}
      <div className="block select-none leading-none w-full shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReturnToHubRedirect}
          className="h-8 px-3 rounded-full font-bold uppercase tracking-wider text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground -ml-3"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Hub Matrix</span>
        </Button>
      </div>

      {/* HUD LEVEL 2: COMPOSITE PROFILE CONTEXT DESKTOP HEADER */}
      <header className="space-y-1 block select-none pointer-events-none w-full shrink-0 leading-none">
        <div className="flex items-center gap-3.5 leading-none w-full block">
          <div className="h-10 w-10 rounded-lg bg-blue-500/5 flex items-center justify-center border border-blue-500/10 shrink-0 text-blue-600 shadow-2xs">
            <Briefcase className="h-5 w-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground pt-0.5 block truncate max-w-[240px] sm:max-w-xl">
            {targetCompanyContextStr ? `${targetCompanyContextStr} Openings` : "Placement Opportunities Index"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/60 leading-none block pt-1">
          {isDataLayerLoading
            ? "Searching active tracking records registry..."
            : `Found ${processedFilteredJobsList.length.toString()} open positions aligned with profile parameters.`}
        </p>
      </header>

      {/* HUD LEVEL 3: CLEAN SAAS INTERACTION INPUT CONFIGURATION LAYER BAR */}
      <div className="flex gap-3 w-full shrink-0 leading-none items-center select-none">
        <div className="relative flex-1 block group leading-none h-10">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 stroke-[2.2] group-focus-within:text-blue-600 transition-colors pointer-events-none" />
          <Input
            type="search"
            placeholder="Search matching positions by title designation or explicit corporate identifier..."
            value={textSearchQueryInput}
            onChange={(e) => setTextSearchQueryInput(e.target.value)}
            className="w-full h-10 pl-9 pr-9 bg-background border border-border/40 text-xs sm:text-sm font-semibold rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {textSearchQueryInput && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md text-muted-foreground/40 hover:text-foreground cursor-pointer transition-colors"
              onClick={() => setTextSearchQueryInput("")}
            >
              <X className="h-3.5 w-3.5 stroke-[2.5]" />
            </Button>
          )}
        </div>

        {/* REFINEMENT CONFIGURATION OVERLAY DRAWER PANEL */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wide border border-border/60 bg-background hover:bg-accent cursor-pointer transition-all shrink-0 shadow-2xs gap-1.5 relative pt-0.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Filters</span>

              {compositeActiveFiltersCounterInt > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-[18px] px-1 rounded bg-blue-600 text-white text-[9px] font-mono font-black flex items-center justify-center shadow-xs select-none pointer-events-none tabular-nums leading-none rounded-xs border border-background">
                  {compositeActiveFiltersCounterInt.toString()}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-full sm:w-[380px] overflow-hidden block select-none border-l border-border/60 bg-popover/95 backdrop-blur-md"
          >
            <SheetHeader className="text-left select-none pointer-events-none block leading-none pb-3 border-b border-border/10">
              <SheetTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
                Refine Parameters Matrix
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-160px)] pr-2 mt-4 block w-full">
              <div className="space-y-6 block w-full pb-16">
                {/* FILTER COMPONENT A: JOB TYPE TARGET CHECKBOXES */}
                <div className="space-y-2.5 block w-full leading-none">
                  <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none pb-1 border-b border-border/5 mb-1.5">
                    Employment Structural Variant
                  </Label>
                  <div className="space-y-1 block w-full">
                    {Object.entries(JOB_TYPES).map(([keyTokenStr, itemConfigNode]) => (
                      <label
                        key={`filter-checkbox-row-${keyTokenStr}`}
                        className="flex items-center justify-between gap-4 p-2 rounded-lg border border-transparent hover:bg-muted/40 hover:border-border/10 cursor-pointer transition-all block w-full leading-none"
                      >
                        <span className="text-xs font-semibold text-foreground/80 pt-0.5">{itemConfigNode.label}</span>
                        <Checkbox
                          checked={selectedJobTypesArray.includes(keyTokenStr)}
                          onCheckedChange={() => {
                            const isCurrentSelected = selectedJobTypesArray.includes(keyTokenStr);
                            setSelectedJobTypesArray((prevCache) =>
                              isCurrentSelected
                                ? prevCache.filter((tokenStr) => tokenStr !== keyTokenStr)
                                : [...prevCache, keyTokenStr],
                            );
                          }}
                          className="rounded-xs h-4 w-4 border-border/80 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors shadow-2xs"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* FILTER COMPONENT B: FINANCIAL QUANTUM SCALE SLIDER */}
                <div className="space-y-3 block w-full leading-none">
                  <div className="flex justify-between items-center leading-none w-full block shrink-0">
                    <Label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground/60 tracking-wide block leading-none">
                      Minimum Salary Threshold
                    </Label>
                    <span className="font-mono text-[10px] font-black uppercase text-blue-600 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 tabular-nums">
                      {minimumSalaryValueInt > 0 ? `$${minimumSalaryValueInt.toString()}K+` : "UNLIMITED FALLBACK"}
                    </span>
                  </div>

                  <div className="pt-2 block w-full px-1">
                    <Slider
                      value={[minimumSalaryValueInt]}
                      onValueChange={(extractedVal) => {
                        const numericResolutionValue = Array.isArray(extractedVal) ? extractedVal[0] : extractedVal;
                        setMinimumSalaryValueInt(Number(numericResolutionValue) || 0);
                      }}
                      max={150}
                      step={5}
                      className="[&_[role=slider]]:border-blue-600 [&_[role=slider]]:bg-blue-600 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 cursor-pointer shadow-none"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* PANEL LOWER SUBMIT HOOK ACTIONS */}
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/20 flex flex-row gap-3 w-full shrink-0 leading-none">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearAllFiltersAction}
                className="flex-1 h-9 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors shadow-none"
              >
                Reset Matrix
              </Button>
              <Button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 h-9 rounded-lg font-bold uppercase text-xs tracking-wider bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors shadow-xs transform-gpu active:scale-[0.985]"
              >
                Apply Criteria
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* HUD LEVEL 4: LEDGER DIRECTORY OUTPUT MANIFEST PANELS */}
      {isDataLayerLoading ? (
        <div className="space-y-2 block w-full select-none pointer-events-none">
          {SKELETON_ITEMS.map((idxNum) => (
            <Card
              key={`jobs-loading-skeleton-row-${idxNum}`}
              className="rounded-lg border border-border/40 shadow-none block w-full bg-card/10 animate-pulse"
            >
              <CardContent className="p-4 space-y-2 block w-full leading-none">
                <Skeleton className="h-4.5 w-1/2 rounded-xs block" />
                <Skeleton className="h-3.5 w-1/4 rounded-xs block" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : processedFilteredJobsList.length === 0 ? (
        <div className="pt-6 block w-full">
          <EmptyState
            icon={Briefcase}
            title="Criteria Index Unmatched"
            description="No career opening entries resolved matching the specified tracking parameters filters list configurations."
            action={{ label: "Purge Filtering Coordinates", onClick: handleClearAllFiltersAction }}
          />
        </div>
      ) : (
        <div className="space-y-2 pb-12 block w-full">
          {processedFilteredJobsList.map((jobItem) => (
            <div
              key={`jobs-directory-row-card-item-${jobItem.id}`}
              className="transition-transform duration-150 hover:-translate-y-0.5 block w-full"
            >
              <JobCard
                job={jobItem}
                isSaved={checkIsJobSaved(jobItem.id, "job")}
                onSaveToggle={() => triggerToggleSaveMutation(jobItem.id, "job")}
                onClick={() => navigateHook(`/app/jobs/${jobItem.id}`)}
              />
            </div>
          ))}

          {/* ASYNC PAGINATION EXPANSION INCREMENT SYSTEM TRIGGERS */}
          {hasMoreRecordsAvailable && (
            <div className="flex justify-center pt-4 w-full select-none leading-none">
              <Button
                type="button"
                variant="outline"
                disabled={isPaginationLoadingMore}
                onClick={() => fetchMarketplaceJobsInventory(currentPageIndexInt + 1, true)}
                className="h-9 px-6 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wider border border-border/60 bg-background/50 hover:bg-accent gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground/60 stroke-[2.5]",
                    isPaginationLoadingMore && "animate-spin",
                  )}
                />
                <span>{isPaginationLoadingMore ? "Synchronizing Index Rows..." : "Load Additional Placements"}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
