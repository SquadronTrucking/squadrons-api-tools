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

// router.post("/estimate", async (req, res, next) => {
//   try {
//     const { origin, destination, arrivalTime, stops } = req.body;

//     const dataArr = await Promise.all(
//       stops.map(async (stop) => {
//         const { data } = await axios.get(
//           `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${stop}&destinations=${destination}&arrival_time=${moment(
//             arrivalTime,
//             "HH:mm"
//           ).unix()}&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
//         );
//         console.log(data);

//         const durationValue = data.rows[0].elements[0].duration.value;
//         const durationText = data.rows[0].elements[0].duration.text;
//         const arrivalTimeMoment = moment(arrivalTime, "HH:mm");
//         const formattedTime = arrivalTimeMoment
//           .add(durationValue, "seconds")
//           .format("HH:mm");

//         return {
//           data,
//           "time#1": formattedTime,
//         };
//       })
//     );

//     res.json(dataArr);
//   } catch (error) {
//     console.log(error);
//   }
// });
router.post("/estimate", async (req, res, next) => {
  try {
    const { origin, destination, arrivalTime, stops } = req.body;

    const dataArr = await Promise.all(
      stops.map(async (stop) => {
        const { data } = await axios.get(
          `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${stop}&destinations=${destination}&arrival_time=${moment(
            arrivalTime,
            "HH:mm"
          ).unix()}&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
        );
        console.log(data);

        const durationValue = data.rows[0].elements[0].duration.value;
        const durationText = data.rows[0].elements[0].duration.text;

        const arrivalTimeMoment = moment(arrivalTime, "HH:mm");
        const HOS = moment.duration({ hours: 12, minutes: 45 }); // 12 hours and 45 minutes HOS
        arrivalTimeMoment.add(HOS); // Add HOS to the arrival time
        arrivalTimeMoment.subtract(durationValue, "seconds"); // Subtract the duration from the arrival time

        const formattedTime = arrivalTimeMoment.format("HH:mm");

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
