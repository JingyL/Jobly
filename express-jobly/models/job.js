"use strict";

const db = require("../db");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     **/
    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs
       (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle
            ],
        );
        console.log(result.rows)
        const job = result.rows[0];

        return job;
    }


    /** Find all jobs.
    * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
    * */

    static async findAll() {
        const jobRes = await db.query(
            `SELECT j.id, 
                j.title, 
                j.salary, 
                j.equity, 
                j.company_handle AS "companyHandle", 
                c.name AS "companyName"
       FROM jobs AS j
       LEFT JOIN companies AS c 
       ON j.company_handle = c.handle`);
       console.log(jobRes.rows)
        return jobRes.rows;
    }


//     /** searchFilters (all optional):
//      * - minSalary
//      * - hasEquity (true returns only jobs with equity > 0, other values ignored)
//      * - title (will find case-insensitive, partial matches)
//      *
//      * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
//      * */

    static async filter(filterObj) {

        let queryStrArray = []
        let params = []
        let idx = 1
        for (const [key, value] of Object.entries(filterObj)) {
            if (key == "minSalary") {
                queryStrArray.push(`salary > $${idx}`);
                params.push(filterObj[key]);
            }
            if (key == "hasEquity" && filterObj["hasEquity"]) {
                queryStrArray.push(`equity > $${idx}`);
                params.push(0);
            }
            if (key == "title") {
                queryStrArray.push(`LOWER(title) LIKE $${idx}`);
                params.push(`%${filterObj[key].toLowerCase()}%`);
            }
            idx += 1;
        }
        let queryStr = queryStrArray.join(' AND ')
        const jobRes = await db.query(
            `SELECT j.id, 
                j.title, 
                j.salary, 
                j.equity, 
                j.company_handle AS "companyHandle", 
                c.name AS "companyName"
       FROM jobs AS j
       JOIN companies AS c
       ON j.company_handle = c.handle
       WHERE ${queryStr}`, params);
        return jobRes.rows;
    }


//     /** Given a job id, return data about job.
//    *
//    * Returns { id, title, salary, equity, companyHandle, company }
//    *   where company is { handle, name, description, numEmployees, logoUrl }
//    *
//    * Throws NotFoundError if not found.
//    **/
    static async get(id) {
        const jobRes = await db.query(
            `SELECT j.id, 
                    j.title, 
                    j.salary, 
                    j.equity, 
                    j.company_handle, 
                    c.name,
                    c.description, 
                    c.num_employees, 
                    c.logo_url
           FROM jobs AS j
           JOIN companies AS c
           ON j.company_handle = c.handle
           WHERE id = $1`, [id]);
        if (!jobRes.rows[0]) throw new NotFoundError(`No job: ${id}`);
        let data = jobRes.rows[0];
        return {
   
                "id": data.id,
                "salary": data.salary,
                "equity": data.equity,
                "title": data.title,
                "company": {
                    "handle": data.company_handle,
                    "name": data.name,
                    "description": data.description,
                    "numEmployees": data.num_employees,
                    "logoUrl": data.logo_url
                }
  
        };
    }





//     /** Update job data with `data`.
//      *
//      * This is a "partial update" --- it's fine if data doesn't contain
//      * all the fields; this only changes provided ones.
//      *
//      * Data can include: { title, salary, equity }
//      *
//      * Returns { id, title, salary, equity, companyHandle }
//      *
//      * Throws NotFoundError if not found.
//      */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }



//     /** Delete given job from database; returns undefined.
//     *
//     * Throws NotFoundError if company not found.
//     **/
    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`, [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;