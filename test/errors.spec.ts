import assert from "assert";
import path from "path";
import fs from "fs";

import { Server } from "../misc/Server";
import { timer } from "rxjs";
import { Article } from "../example/article.dto";
import { JsonResource } from "../src/json/JsonResource";

const port = 3000;

describe("Error Management", function () {
  it("should throw an error if server is started on same port", async function () {
    try {
      const server1 = new Server({ port });
      await server1.start();
      try {
        const server2 = new Server({ port });
        await server2.start();
        assert.fail("server2 should not start");
      } catch (e) {
        assert(e instanceof Error);
        assert.strictEqual(
          e.message,
          `listen EADDRINUSE: address already in use :::${port}`
        );
      }
      await server1.stop();
    } catch (error) {}
  });

  it("should continue to run even if a socket error is emitted", async function () {
    try {
      const server = new Server({ port });
      await server.start();
      server.server.emit("error", { test: "fake error" });
      await timer(100).toPromise();
      await server.stop();
    } catch (error) {
      assert.fail(error);
    }
  });

  it("should throw an error while closing", async function () {
    try {
      const server = new Server({ port });
      await server.start();
      await server.stop();
      await server.stop();
      assert.fail("you should not go here");
    } catch (error) {
      assert(error instanceof Error);
      assert.strictEqual(
        (error as NodeJS.ErrnoException).code,
        "ERR_SERVER_NOT_RUNNING"
      );
    }
  });

  it("should start with an existing json filename", async function () {
    try {
      const article: Article = {
        id: "12",
        name: "Tournevis",
        price: 2.99,
        qty: 100,
      };
      const articles = [article];
      const filename = path.resolve(__dirname, "../data/test.json");
      const resource = new JsonResource<Article>({ filename });

      fs.writeFileSync(filename, JSON.stringify(articles));
      const server = new Server({ port, resource });
      await server.start();
      await server.stop();
    } catch (e) {
      assert.fail(e);
    }
  });
});
