import React from "react";

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  "quiz-manage": React.lazy(() => import("@/pages/QuizManagement")),
};

export const TITLES: Record<string, string> = {
  "quiz-manage": "Certification Logic",
};
