"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureCurrentUserOrAdmin } = require("../middleware/auth");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle}
 *
 * Returns { id, title, salary, equity, companyHandle  }
 *
 * Authorization required: login and to be admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});



/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity (true returns only jobs with equity > 0, other values ignored)
 * - title (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        console.log(req.query)
        // const validator = jsonschema.validate(req.body, jobSearchSchema);
        if (req.query.hasEquity) {
            req.query.hasEquity = true
        }
        if (req.query.minSalary) {
            req.query.minSalary = parseInt(req.query.minSalary)
        }
        const validator = jsonschema.validate(req.query, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        let jobs;
        if (Object.keys(req.query).length === 0) {
            jobs = await Job.findAll();
        } else {
            jobs = await Job.filter(req.query);
        }
        console.log(jobs)
        return res.json({ jobs });

    } catch (err) {
        return next(err);
    }
});


/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle, company }
*   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login and to be admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login be admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: parseInt(req.params.id) });
    } catch (err) {
        return next(err);
    }
});




module.exports = router;