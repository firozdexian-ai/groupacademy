import { Navigate } from "react-router-dom";

/**
 * Career Abroad — retired in favor of the Hub tab in Learning.
 * All abroad surfaces (study, IELTS, roadmap) live as standalone routes;
 * the discovery hub now lives inside Learning > Arena > Study Abroad.
 */
export default function CareerAbroad() {
  return <Navigate to="/app/learning?tab=events&kind=abroad" replace />;
}
