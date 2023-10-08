var express = require("express");
var axios = require("axios");
const moment = require("moment/moment");
const {
  calculateDistances,
  addTimes,
  subtractTimes,
} = require("../util/getDistance");
var router = express.Router();

router.use(express.json());

/* GET home page. */
router.get("/distance/:origins/:destinations", async (req, res, next) => {
  const { origins } = req.params;
  const { destinations } = req.params;
  const key = "wNKvwwrlvWheyBOd84pP8uIsbqhW1";
  const url = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&departure_time=now&key=${key}`;

  try {
    const DistanceResponse = await axios.get(url);
    const distance = DistanceResponse.data;

    res.send(distance);
  } catch (error) {
    console.error(error);
  }
});

router.post("/estimate", async (req, res, next) => {
  try {
    const { origin, destination, arrivalTime, stops, multiplier } = req.body;

    const dataArr = await Promise.all(
      stops.map(async (stop, index) => {
        const { data } = await axios.get(
          `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${stop}&mode=driving&destinations=${destination}&arrival_time=${moment(
            arrivalTime,
            "HH:mm"
          ).unix()}&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
        );

        //for time#calculation
        const res = await axios.get(
          `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${stop}&destinations=${
            stop[index + 1]
          }&mode=driving&arrival_time=${moment(
            arrivalTime,
            "HH:mm"
          ).unix()}&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
        );

        let durationValue = data.rows[0].elements[0].duration.value;

        durationValue = durationValue * multiplier;

        const durationText = data.rows[0].elements[0].duration.text;

        const arrivalTimeMoment = moment(arrivalTime, "HH:mm");
        const HOS = moment.duration({ hours: 12, minutes: 45 }); // 12 hours and 45 minutes HOS
        arrivalTimeMoment.add(HOS); // Add HOS to the arrival time
        arrivalTimeMoment.subtract(durationValue, "seconds"); // Subtract the duration from the arrival time

        const formattedTime = arrivalTimeMoment.format("HH:mm");

        if (index == stops.length - 1) {
          console.log("Skipping time # 2 for final path");
          return {
            data,
            "time#1": formattedTime,
            "time#2": null,
          };
        } else {
          let time_2_hours = await calculateDistances(
            `${stops[index]}`,
            `${stops[index + 1]}`,
            `${destination}`,
            multiplier
          );

          let added_time = addTimes(arrivalTime, "12:45");

          return {
            data,
            "time#1": formattedTime,
            "time#2": subtractTimes(`${added_time}`, `${time_2_hours}`),
          };
        }
      })
    );

    res.json(dataArr);
  } catch (error) {
    res.json("Error occured");
    console.log(error);
  }
});

router.get("/docs", (req, res) => {
  res.render("doc");
});

module.exports = router;
