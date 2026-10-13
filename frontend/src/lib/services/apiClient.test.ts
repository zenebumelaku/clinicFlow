import assert from "node:assert/strict";
import test from "node:test";
import { apiPath } from "./apiClient";

test("apiPath serializes defined query parameters and omits empty values", () => {
  assert.equal(
    apiPath("/patients", {
      search: "Jane Doe",
      page: 2,
      active: true,
      empty: "",
      missing: undefined,
    }),
    "/patients?search=Jane+Doe&page=2&active=true",
  );
});
