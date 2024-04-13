function hourToMinutes(hourString) {

    // Calculate total minutes
    const totalMinutes = Number(hourString) * Number(60);

    return totalMinutes;
}


module.exports = { hourToMinutes }