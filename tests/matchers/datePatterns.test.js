import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesDate } from "../../src/matchers/datePatterns.js";

describe("matchesDate", () => {
  const shouldMatch = [
    ["relative - today", "I just watched this today"],
    ["relative - yesterday", "yesterday this was great"],
    ["relative - 3 days ago", "3 days ago this was uploaded"],
    ["day of week", "Monday gang where are you"],
    ["month-day EN", "Jan 12 2024"],
    ["month-day EN with ordinal", "11th of September was wild"],
    ["day-month EN", "12 January 2024"],
    ["compact day-month", "12th Jan 2024"],
    ["month-year EN", "January 2024"],
    ["year-month EN", "2024 January"],
    ["numeric DMY", "12/04/24"],
    ["numeric DMY with dots", "12.04.2024"],
    ["numeric DMY with dashes", "12 - 04 - 2024"],
    ["numeric YMD", "2024/12/04"],
    ["Devanagari day-month", "15 जनवरी 25 को कौन सुन रहा है"],
    ["Devanagari month-day", "१० अप्रैल २०२६ को कौन देख रहा है"],
    ["anyone today", "Anyone here in 2026?"],
    ["anyone watching", "Anyone watching this?"],
    ["short month day", "7 jun 2024 main bahut bhagyashali hu"],
    ["Hindi date phrase", "Aaj 6 April hai Monday hai"],
    ["Hindi date with numbers", "30 march 2026 ko jo b sun rha h"],
    ["anyone today direct", "Anyone today?"],
    ["slash format spaced", "12 / 04 / 24"],
    ["slash format compact", "4/5/26"],
    ["slash format with year", "4/ 5/2026"],
    ["dashes with spaces", "31 - 12 - 2025 vale hajir ho"],
    ["dashes with spaces short year", "31 - 12 - 25"],
    ["dots with spaces", "31 . 12 . 2025"],
    ["mixed separators", "31/12 - 2025"],
  ];

  const shouldNotMatch = [
    ["plain number", "Top 10 songs"],
    ["version number", "Released in version 2.0.1"],
    ["empty string", ""],
    ["normal text", "This song is amazing"],
    ["non-date numbers", "I have 2 cats and 4 dogs"],
    ["time reference", "This beat hits 24/7"],
    ["decade reference", "The 90s were a great era"],
    ["question without date", "Anyone here for the guitar solo?"],
    ["Hindi without date", "Joy shree ram Joy hanuman chalisa"],
    ["Hindi month name only (no date)", "जनवरी में ठंड ज्यादा होती है"],
  ];

  for (const [label, text] of shouldMatch) {
    it(`matches: ${label}`, () => {
      assert.equal(matchesDate(text).matched, true);
    });
  }

  for (const [label, text] of shouldNotMatch) {
    it(`does not match: ${label}`, () => {
      assert.equal(matchesDate(text).matched, false);
    });
  }
});
