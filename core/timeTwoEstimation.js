const axios = require("axios");
const fetch_distance = async (origin, destination, retries = 5) => {
  try {
    let result = await axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
    );

    if (result.data.rows[0].elements[0].status === "OK") {
      console.log(result.data.rows[0].elements);
      return result;
    }
    if (result.data.rows[0].elements[0].status == "ZERO_RESULTS") {
      throw new Error("Status is not OK");
    }
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left.`);
      return await fetch_distance(origin, destination, retries - 1);
    } else {
      console.log(`Failed after 5 attempts.`);
      return { status: false };
    }
  }
};

const estimateTimeTwo = async (trips_arr, base_addr, multiplier, stop_time) => {
  try {
    let base_address = base_addr;
    let pts = trips_arr.points;

    let estimates = [];

    for (let i = 0; i < pts.length; i++) {
      //this is duration 1
      //duration 1 = current point => Base
      //time 1 for duration time 1 = arrival time - duration 1
      let duration_1 = await fetch_distance(
        pts[i].doc.origin_point_adress,
        base_address
      );

      if (i < pts.length - 1) {
        let first_step = await fetch_distance(
          pts[i].doc.origin_point_adress,
          pts[i + 1].doc.origin_point_adress
        );
        let second_step = await fetch_distance(
          pts[i + 1].doc.origin_point_adress,
          base_address
        );

        estimates.push({
          current_point: pts[i].name,
          next_point: pts[i + 1].name,
          origin: pts[i].doc.origin_point_adress,
          mid_point: pts[i + 1].doc.origin_point_adress,
          final_stop: base_address,
          first_step: JSON.stringify(first_step.data.rows[0].elements[0]),
          second_step: JSON.stringify(second_step.data.rows[0].elements[0]),
          duration_1: JSON.stringify(duration_1.data.rows[0].elements[0]),
        });
      }
    }

    const newData = estimates.map((obj) => {
      const firstStep = JSON.parse(obj.first_step);
      const secondStep = JSON.parse(obj.second_step);
      const duration_1 = JSON.parse(obj.duration_1);

      let first_step_with_multiplier =
        Number(firstStep.duration.value) * Number(multiplier);
      let second_step_step_with_multiplier =
        Number(secondStep.duration.value) * Number(multiplier);

      // Calculate total time in seconds
      let totalTime =
        Number(first_step_with_multiplier) +
        Number(second_step_step_with_multiplier);

      //duration_1 time with drop time added
      console.log(stop_time,"*****************stop time");
      let duration_1_drop_time_added =
        Number(duration_1.duration.value) + Number(stop_time);

      //hardcoded for now needs to change to changeable variable and name will be stop time to drop time
      totalTime = Number(totalTime) + Number(stop_time);

      // Convert total time to hours (round to two decimal places)
      const totalTimeInHours = (totalTime / 3600).toFixed(2);

      //duration 1 converted to hours
      duration_1_in_hrs = (duration_1_drop_time_added / 3600).toFixed(2);

      // Create a new object with desired properties
      return {
        current_point: obj.current_point,
        next_point: obj.next_point,
        origin: obj.origin,
        mid_point: obj.mid_point,
        final_stop: obj.final_stop,
        totalTimeInHours: totalTimeInHours,
        duration_1: duration_1_in_hrs,
        duration_1_hrs: duration_1_in_hrs,
      };
    });

    console.log(newData);

    return newData;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { estimateTimeTwo };
