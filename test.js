// // const axios = require("axios");

const { calculateDistances } = require("./util/getDistance");

!(async function () {
  let data = await calculateDistances(
    "SAN BERNARDINO, CALIFORNIA 92408",
    "3100 Sakioka Drive OXNARD, California 93030",
    "900 E Cooley Ave, San. Bernardino, Ca"
  );
  console.log(data);
})();
