const { clockhoursToMinutes } = require("./clockHourToMinutes");
const { hourToMinutes } = require("./hoursToMinutes");
const { minutesToHHMM } = require("./minutesToHM");

function calculateTime2(data, onDutyTime, HOS_) {
    const newTimeData = [];
    let ODT = clockhoursToMinutes(onDutyTime);
    let HOS = clockhoursToMinutes(HOS_);

    let arrivalTimeOnYard = Number(ODT) + Number(HOS)

    for (const item of data) {

        /**
         * Duration two calculation logic below
         */

        let totalMinutesDuration = hourToMinutes(item.totalTimeInHours)
        let durationOneToMins = hourToMinutes(item.duration_1)

        let timeRemained = Number(arrivalTimeOnYard) - Number(totalMinutesDuration)

        console.log(minutesToHHMM(timeRemained));

        item.time_two = minutesToHHMM(timeRemained)

        /**
         * Duration one calculation logic below
         */

        //duration 1 calculations
        let duration_1_remained = Number(arrivalTimeOnYard) - Number(durationOneToMins)

        item.time_1 = minutesToHHMM(duration_1_remained)

        newTimeData.push(item)


    }

    console.log(newTimeData);

    return newTimeData;
}

module.exports = { calculateTime2 }