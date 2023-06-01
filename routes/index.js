var express = require("express");
var axios = require("axios");
const moment = require("moment/moment");
var router = express.Router();

router.use(express.json());

/* GET home page. */
router.get("/distance/:origins/:destinations", async (req, res, next) => {
  const { origins } = req.params;
  const { destinations } = req.params;
  const key = "km4BvMVHSpKRoUubcVBeDyiE0H5Ec";
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
    const { origin, destination, arrivalTime, stops } = req.body;

    const hosDuration = moment.duration({ hours: 12, minutes: 45 });
    let currentArrivalTime = moment(arrivalTime, "HH:mm");

    const dataArr = await Promise.all(
      stops.map(async (stop, index) => {
        const { data } = await axios.get(
          `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${stop}&destinations=${destination}&arrival_time=${currentArrivalTime.unix()}&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
        );
        console.log(data);

        const durationValue = data.rows[0].elements[0].duration.value;
        const durationText = data.rows[0].elements[0].duration.text;

        let formattedTime;
        if (index === 0) {
          formattedTime = currentArrivalTime
            .add(durationValue, "seconds")
            .format("HH:mm");
        } else {
          formattedTime = currentArrivalTime
            .add(durationValue, "seconds")
            .format("HH:mm");
        }

        currentArrivalTime = moment(formattedTime, "HH:mm");

        return {
          data,
          "time#1": formattedTime,
        };
      })
    );

    res.json(dataArr);
  } catch (error) {
    console.log(error);
  }
});

router.get("/docs", (req, res) => {
  res.render("doc");
});

module.exports = router;
