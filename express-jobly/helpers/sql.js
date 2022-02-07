const { BadRequestError } = require("../expressError");

/* update partial info in database
Two arguments: dataToUpdate and jsToSql.
   dataToUpdate is requested info sent by client.
   jsToSql is the database's colname objects. 
      jsToSql keys's values are corespond with dataToUpdate keys's name */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
