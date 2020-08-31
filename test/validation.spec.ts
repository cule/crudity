import fetch from "node-fetch";
import { strict as assert } from "assert";
import path from "path";
import fs from "fs";
import _ from "lodash";

import { Server } from "../misc/Server";
import { Article } from "../example/article.dto";

const port = 3000;
const filename = path.resolve(__dirname, "../data/test.json");
try {
  fs.unlinkSync(filename);
} catch (e) {}

describe("Validation", function () {
  it("should create article with error", async function () {
    try {
      const server = new Server<Article>({
        port,
        filename,
        dtoClass: Article,
      });
      await server.start();
      await server.reset();

      const article = {};
      const response = await fetch(`http://localhost:${port}/ws/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      assert.equal(response.status, 400);
      const error = await response.json();
      const expectedError = [
        {
          target: {},
          property: "name",
          children: [],
          constraints: { isDefined: "name should not be null or undefined" },
        },
        {
          target: {},
          property: "price",
          children: [],
          constraints: { isDefined: "price should not be null or undefined" },
        },
        {
          target: {},
          property: "qty",
          children: [],
          constraints: { isDefined: "qty should not be null or undefined" },
        },
      ];
      assert(_.isEqual(expectedError, error));
      await server.stop();
    } catch (e) {
      assert.fail(e);
    }
  });

  it("should not validate", async function () {
    try {
      const server = new Server<Article>({
        port,
        filename,
      });
      await server.start();
      await server.reset();

      const article = {};
      const response = await fetch(`http://localhost:${port}/ws/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      assert.equal(response.status, 201);
      const array = await server.getArray();
      assert.equal(array.length, 1);
      await server.stop();
    } catch (e) {
      assert.fail(e);
    }
  });
});