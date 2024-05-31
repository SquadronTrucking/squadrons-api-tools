var express = require("express");
var axios = require("axios");
const moment = require("moment/moment");

const { estimateTimeTwo } = require("../core/timeTwoEstimation");
const { calculateTime2 } = require("../util/calculateTimeTwo");
var router = express.Router();

router.use(express.json());

//grab the api key
const key = process.env.KEY;

/* GET home page. */
router.get("/distance/:origins/:destinations", async (req, res, next) => {
  const { origins } = req.params;
  const { destinations } = req.params;

  const url = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&departure_time=now&key=${key}`;

  try {
    const DistanceResponse = await axios.get(url);
    const distance = DistanceResponse.data;

    res.send(distance);
  } catch (error) {
    console.error(error);
  }
});

router.post("/estimate_time_two", async (req, res, next) => {
  try {
    const { trips_data, on_duty_time, hos, stop_time, base_addr, multiplier } =
      req.body;

      console.log(stop_time,multiplier,"*************stop time multiplier");

    let estimated_data = await estimateTimeTwo(
      trips_data,
      base_addr,
      multiplier,
      stop_time
    );

    console.log("*********Estimated data**********");
    console.log(estimated_data);

    let time_two_calculated = calculateTime2(estimated_data, on_duty_time, hos);

    res.json(time_two_calculated);
  } catch (error) {
    res.json("Error occured");
    console.log(error);
  }
});

router.get("/docs", (req, res) => {
  res.render("doc");
});

module.exports = router;
