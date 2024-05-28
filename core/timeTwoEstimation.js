const axios = require("axios");
const fetch_distance = async (origin, destination, retries = 5) => {
  try {
    let result = await axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
    );

    if (result.data.status === "OK") {
      console.log(result.data);
      return result;
    } else {
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
  let base_address = base_addr;
  let pts = trips_arr.points;

  let estimates = [];

  for (let i = 0; i < pts.length; i++) {
    // Fetch the distance for duration_1
    let pts_addr = pts[i].doc["origin_point_adress"];
    console.log(pts_addr, base_addr);
    let duration_1 = await fetch_distance(pts_addr, base_address);

    if (i < pts.length - 1) {
      // Fetch distances for first and second steps concurrently
      let [first_step, second_step] = await Promise.all([
        fetch_distance(
          pts[i].doc.origin_point_adress,
          pts[i + 1].doc.origin_point_adress
        ),
        fetch_distance(pts[i + 1].doc.origin_point_adress, base_address),
      ]);

      // Push the result to the estimates array
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

  const newData = [];

  for (const obj of estimates) {
    // Parse the JSON strings
    const firstStep = JSON.parse(obj.first_step);
    const secondStep = JSON.parse(obj.second_step);
    const duration_1 = JSON.parse(obj.duration_1);

    console.log("************Iterating obj inside Est**********");
    console.log(obj);

    // Check if duration exists in firstStep, secondStep, and duration_1
    if (!firstStep.duration || !secondStep.duration || !duration_1.duration) {
      console.log(`Duration property is missing in object number: ${obj}`);
      console.log(obj);
      continue; // Skip to the next iteration if duration is missing
    }

    // Calculate times with multipliers
    let first_step_with_multiplier =
      Number(firstStep.duration.value) * Number(multiplier);
    let second_step_step_with_multiplier =
      Number(secondStep.duration.value) * Number(multiplier);

    // Calculate total time in seconds
    let totalTime =
      Number(first_step_with_multiplier) +
      Number(second_step_step_with_multiplier);

    // Add drop time to duration_1
    let duration_1_drop_time_added =
      Number(duration_1.duration.value) + Number(stop_time);

    // Add drop time to total time
    totalTime = Number(totalTime) + Number(stop_time);

    // Convert total time to hours (round to two decimal places)
    const totalTimeInHours = (totalTime / 3600).toFixed(2);

    // Convert duration_1 to hours
    const duration_1_in_hrs = (duration_1_drop_time_added / 3600).toFixed(2);

    // Create a new object with the desired properties
    const newObj = {
      current_point: obj.current_point,
      next_point: obj.next_point,
      origin: obj.origin,
      mid_point: obj.mid_point,
      final_stop: obj.final_stop,
      totalTimeInHours: totalTimeInHours,
      duration_1: duration_1_in_hrs,
      duration_1_hrs: duration_1_in_hrs,
    };

    // Push the new object into newData array
    newData.push(newObj);
  }

  // Return the newData array after processing all estimates
  return newData;
};

module.exports = { estimateTimeTwo };
