import express, { Router } from "express";
import { Resource } from "./src/Resource";
import { CrudityOptions } from "./src/CrudityOptions";
import { getPageSlice, orderBy, filter, select } from "./src/misc";
import { CrudityQueryString } from "./src/CrudityQueryString";

export interface Idable {
  id?: string;
}

/**
 * Middleware that exposes a CRUD on a resource
 *
 * @export
 * @class Crudity
 * @template T
 */
export class Crudity<T extends Idable> {
  options: CrudityOptions;
  resource: Resource<T>;
  router: Router;
  constructor(opts: CrudityOptions) {
    this.options = {
      debounceTimeDelay: 2000,
      minify: false,
      pageSize: 20,
      ...opts,
    };
    this.resource = new Resource<T>(this.options);

    const app = express.Router();

    app.post("/", (req, res) => {
      if (req.body instanceof Array) {
        // bulk scenario
        const array: T[] = [];
        for (const item of req.body as T[]) {
          array.push(this.resource.add(item));
        }
        return res.status(201).json(array);
      }
      const t: T = req.body;
      const newT = this.resource.add(t);
      return res.status(201).json(newT);
    });

    app.get("/", (req, res) => {
      console.log("req.query", req.query);
      const query = req.query as CrudityQueryString;

      // check syntax
      if (typeof query.filter === "string") {
        return res
          .status(400)
          .end(
            "filterSpec cannot be a string, but an object. Please read filter documentation."
          );
      }

      // filter
      const filteredArray = filter<T>(this.resource.array$.value, query.filter);

      // order by
      const array = orderBy<T>(filteredArray, req.query.orderBy as string);

      // pagination
      const pageSize = isNaN(+req.query.pageSize)
        ? this.options.pageSize
        : +req.query.pageSize;
      const page = isNaN(+req.query.page) ? 1 : +req.query.page;
      const { start, end } = getPageSlice(pageSize, page);
      const pagedArray = array.slice(start, end);

      // select
      const finalArray = select<T>(pagedArray, req.query.select as string);
      return res.json(finalArray);
    });

    app.get("/:id", (req, res) => {
      const id = req.params.id;
      if (!this.resource.map[id]) {
        return res.status(404).end();
      }
      return res.json(this.resource.map[id]);
    });

    app.put("/:id", (req, res) => {
      const id = req.params.id;
      if (!this.resource.map[id]) {
        return res.status(404).end();
      }
      req.body.id = id;
      const t = this.resource.rewrite(req.body as T);
      return res.json(t);
    });

    app.patch("/:id", (req, res) => {
      const id = req.params.id;
      if (!this.resource.map[id]) {
        return res.status(404).end();
      }
      const t = this.resource.patch(id, req.body);
      return res.json(t);
    });

    app.delete("/", (req, res) => {
      if (!(req.body instanceof Array)) {
        this.resource.removeAll();
        return res.status(204).end();
      }
      const ids: string[] = req.body;
      this.resource.remove(ids);
      return res.status(204).end();
    });

    app.delete("/:id", (req, res) => {
      const id = req.params.id;
      this.resource.remove([id]);
      return res.status(204).end();
    });

    this.router = app;
  }
}
