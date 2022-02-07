const { sqlForPartialUpdate } = require("./sql");

describe("update sql partial info", function () {
    test("one data update", function () {
        const res = sqlForPartialUpdate({"f1":"2"},
        {"f1":"f1", "sf2":"f2"});
        expect(res.setCols).toEqual('"f1"=$1');
        expect(res.values).toEqual(["2"]);
      });
      test("two data update", function () {
        const res = sqlForPartialUpdate({"f1":"2","f2":"3"},
        {"sf2":"f2"});
        expect(res.setCols).toEqual('"f1"=$1, "f2"=$2');
        expect(res.values).toEqual(["2", "3"]);
      });
    // test("no data update", function () {
    //     const res = sqlForPartialUpdate({},{"sf2":"f2"});
    //     console.log(res)
    //     expect(res.message).toEqual("No data");
    // });
    });