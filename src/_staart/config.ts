/**
 * This is the central configuration file for Staart
 * It is RECOMMENDED that you do not modify this file, but create
 * your own configuration file in `src/` to add custom properties.
 */

import { cosmicSync } from "@anandchowdhary/cosmic";
import {
  BaseScopesUser,
  BaseScopesGroup,
  BaseScopesAdmin,
} from "./helpers/authorization";
cosmicSync("staart");

/**
 * Convert a Check if a boolean value is true (supports strings)
 * @param booleanValue - Value to convert
 */
export const bool = (booleanValue?: string | boolean) =>
  String(booleanValue).toLowerCase() === "true";

export const ScopesUser = { ...BaseScopesUser };
export const ScopesGroup = { ...BaseScopesGroup };
export const ScopesAdmin = { ...BaseScopesAdmin };
