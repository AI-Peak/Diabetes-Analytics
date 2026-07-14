import overviewJson from "../../../data/generated/overview.json";
import rq1Json from "../../../data/generated/rq1.json";
import rq2Json from "../../../data/generated/rq2.json";
import rq3Json from "../../../data/generated/rq3.json";
import { OverviewSchema, Rq1Schema, Rq2Schema, Rq3Schema } from "./schemas";

export function loadOverview() {
  return OverviewSchema.parse(overviewJson);
}

export function loadRq1() {
  return Rq1Schema.parse(rq1Json);
}

export function loadRq2() {
  return Rq2Schema.parse(rq2Json);
}

export function loadRq3() {
  return Rq3Schema.parse(rq3Json);
}
