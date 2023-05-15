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

router.post(
  "/estimate/:origins/:destinations/:arrivalTime",
  async (req, res, next) => {
    const { origins, destinations, arrivalTime } = req.params;
    const { restAreas } = req.body;
    const key = "km4BvMVHSpKRoUubcVBeDyiE0H5Ec";

    try {
      const distances = [];
      const departureTime = new Date();

      const originToFirstRestAreaUrl = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origins}&destinations=${restAreas[0]}&key=${key}`;
      const originToFirstRestAreaResponse = await axios.get(
        originToFirstRestAreaUrl
      );
      const originToFirstRestArea =
        originToFirstRestAreaResponse.data.rows[0].elements[0];
      const durationInSeconds = originToFirstRestArea.duration.value;

      const arrivalTime = moment(departureTime).add(
        durationInSeconds,
        "seconds"
      );
      console.log(arrivalTime);

      distances.push({
        ...originToFirstRestArea,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
      });

      let previousArrivalTime = moment(arrivalTime);

      for (let i = 0; i < restAreas.length - 1; i++) {
        const currentRestArea = restAreas[i];
        const nextRestArea = restAreas[i + 1];

        const restAreaUrl = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${currentRestArea}&destinations=${nextRestArea}&key=${key}`;
        const restAreaResponse = await axios.get(restAreaUrl);
        const restArea = restAreaResponse.data.rows[0].elements[0];

        const departureTime = previousArrivalTime.format(); // Use previous arrival time as departure time
        const durationInSeconds = restArea.duration.value;
        const arrivalTime = moment(departureTime)
          .add(durationInSeconds, "seconds")
          .format(); // Calculate arrival time

        distances.push({
          ...restArea,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
        });

        previousArrivalTime = moment(arrivalTime);
      }

      const lastRestAreaToDestinationUrl = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${
        restAreas[restAreas.length - 1]
      }&destinations=${destinations}&key=${key}`;
      const lastRestAreaToDestinationResponse = await axios.get(
        lastRestAreaToDestinationUrl
      );
      const lastRestAreaToDestination =
        lastRestAreaToDestinationResponse.data.rows[0].elements[0];

      const departureTimeLast = previousArrivalTime.format();
      const durationInSecondsLast = lastRestAreaToDestination.duration.value;
      const arrivalTimeLast = moment(departureTimeLast)
        .add(durationInSecondsLast, "seconds")
        .format();

      distances.push({
        ...lastRestAreaToDestination,
        departureTime: departureTimeLast,
        arrivalTime: arrivalTimeLast,
      });

      res.send(distances);
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred");
    }
  }
);

router.get("/docs", (req, res) => {
  res.render("doc");
});

module.exports = router;
