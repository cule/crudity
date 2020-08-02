import { strict as assert } from "assert";
import path from "path";

import { Resource } from "../src/Resource";
import { Article } from "../example/article.dto";

const port = 3000;
const filename = path.resolve(__dirname, "../data/test.json");

describe("Resource", function () {
  it("should not rewrite because no id", async function () {
    try {
      const article: Article = {
        name: "Tournevis",
        price: 2.99,
        qty: 100,
      };
      const resource = new Resource<Article>({ filename, dtoClass: Article });
      resource.rewrite(article);
      assert.fail("should not reach this");
    } catch (e) {
      assert(e instanceof Error);
      assert.equal(e.message, "no id");
    }
  });
});
